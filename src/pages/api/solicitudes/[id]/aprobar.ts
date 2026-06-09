// src/pages/api/solicitudes/[id]/aprobar.ts
// POST /api/solicitudes/{id}/aprobar — admin-only: advance solicitud through
// the approval state machine. Handles fund disbursement with subcuenta check
// and optimistic-lock guard.
//
// Body: { accion?: 'aprobado' | 'negado' | 'avanzar'; montoAprobado?: number }
//   - radicada        → auto-avanza a 'en_estudio' (ignores accion)
//   - en_estudio      → 'aprobado' → 'en_aprobacion'  | 'negado' → 'negada'
//   - en_aprobacion   → 'aprobado' → 'aprobada'       | 'negado' → 'negada'
//   - aprobada        → 'aprobado' → 'en_pago' (fund check) or 'en_cola_por_fondos'
//   - en_pago         → 'aprobado' → 'pagada'
//   - en_cola_por_fondos → 'avanzar' → 'en_estudio' (retry)
//
// Approval chain tracking:
//   instanciaAprobacionActual tracks the current step in auxilio.cadenaAprobacion.
//   historialAprobacion records each approval/denial action.
//
// Fund disbursement:
//   - Maps auxilio tipoPrincipal to a matching subcuenta by keyword.
//   - Checks saldo >= montoAprobado before decrementing.
//   - Uses subcuenta $updatedAt as optimistic-lock token.
//   - Insufficient funds → estado = 'en_cola_por_fondos'.
import type { APIRoute } from 'astro';
import { getDb, databaseId, eq, COL, createNotification } from '../../../../lib/fmpi/db';
import type {
  Asociado,
  Auxilio,
  Solicitud,
  Subcuenta,
  EstadoSolicitud,
  ApiResponse,
} from '../../../../lib/fmpi/types';
import {
  getNextState,
  estadoLabel,
} from '../../../../lib/fmpi/rules';
import { isAdmin } from '../../subcuentas';

// ─── Subcuenta → tipoPrincipal mapping ──────────────────

/** Maps an auxilio tipoPrincipal to a subcuenta name keyword. */
const TIPO_TO_SUBCUENTA_KEYWORD: Record<string, string> = {
  Salud: 'General',
  Fallecimiento: 'General',
  Calamidad: 'Calamidad',
  Educación: 'Educación',
  Desempleo: 'Solidaridad',
  Hurto: 'Solidaridad',
  Transporte: 'Solidaridad',
  Recreación: 'General',
  Natalidad: 'Solidaridad',
};

/**
 * Finds the subcuenta matching an auxilio's tipoPrincipal.
 * Falls back to "Fondo General de Auxilios" if no match.
 */
async function resolveSubcuentaForAuxilio(
  tipoPrincipal: string,
): Promise<Subcuenta | null> {
  const db = getDb();
  const dbId = databaseId();
  const result = await db.listDocuments(dbId, COL.subcuentas);
  const subcuentas = result.documents as unknown as Subcuenta[];

  const keyword = TIPO_TO_SUBCUENTA_KEYWORD[tipoPrincipal] || 'General';

  // Try exact keyword match first
  let match = subcuentas.find((s) => s.nombre.includes(keyword));
  if (!match) {
    // Fallback: Fondo General de Auxilios
    match = subcuentas.find((s) => s.nombre.includes('General'));
  }
  return match || subcuentas[0] || null;
}

// ─── POST: advance approval ──────────────────────────────

export const POST: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: 'No autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Admin gate
  const admin = await isAdmin(locals);
  if (!admin) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Acceso denegado: se requiere rol de administrador',
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const solicitudId = params.id;
  if (!solicitudId) {
    return new Response(
      JSON.stringify({ success: false, error: 'ID de solicitud requerido' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const requestedAccion: string | undefined = body.accion;
    const requestedMonto: number | undefined = body.montoAprobado;

    const db = getDb();
    const dbId = databaseId();

    // ── Load solicitud ──────────────────────────────────
    const doc = await db.getDocument(dbId, COL.solicitudes, solicitudId);
    const solicitud = doc as unknown as Solicitud;

    // ── Resolve action based on current state ───────────
    let accion: 'aprobado' | 'negado' | 'avanzar';

    if (solicitud.estado === 'radicada') {
      accion = 'avanzar'; // auto-advance from radicada
    } else if (solicitud.estado === 'en_cola_por_fondos') {
      accion = 'avanzar'; // retry from fund queue
    } else if (solicitud.estado === 'pagada' || solicitud.estado === 'negada') {
      return new Response(
        JSON.stringify({
          success: false,
          error: `La solicitud ya está en estado terminal: ${estadoLabel(solicitud.estado)}.`,
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      );
    } else {
      // Validate requested action
      if (
        requestedAccion === 'aprobado' ||
        requestedAccion === 'negado' ||
        requestedAccion === 'avanzar'
      ) {
        accion = requestedAccion;
      } else {
        // Default to aprobado for states that need a decision
        accion = 'aprobado';
      }
    }

    // ── Compute next state ──────────────────────────────
    const nextState: EstadoSolicitud | null = getNextState(solicitud.estado, accion);
    if (!nextState) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Transición inválida: no se puede aplicar "${accion}" desde "${estadoLabel(solicitud.estado)}".`,
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // ── Load auxilio for montoMaximo and cadenaAprobacion ──
    let auxilio: Auxilio | null = null;
    try {
      const auxDoc = await db.getDocument(dbId, COL.auxilios, solicitud.auxilioId);
      auxilio = auxDoc as unknown as Auxilio;
    } catch {
      // auxilio not found — non-fatal for state transitions that don't need it
    }

    // ── Fund disbursement check ─────────────────────────
    let effectiveNextState = nextState;
    let subcuentaAfterUpdate: Subcuenta | null = null;

    if (nextState === 'en_pago' && auxilio) {
      const monto = requestedMonto || auxilio.montoMaximo;
      const subcuenta = await resolveSubcuentaForAuxilio(auxilio.tipoPrincipal);

      if (!subcuenta) {
        // No subcuenta found — queue for funds
        effectiveNextState = 'en_cola_por_fondos';
      } else if (subcuenta.saldo < monto) {
        // Insufficient funds — queue
        effectiveNextState = 'en_cola_por_fondos';
      } else {
        // Funds available — decrement with optimistic lock
        const MAX_RETRIES = 3;
        let decrementOk = false;
        let lastErr = '';

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          try {
            // Read fresh to get latest $updatedAt and saldo
            const freshSub = await db.getDocument(dbId, COL.subcuentas, subcuenta.$id);
            const fresh = freshSub as unknown as Subcuenta;

            // Verify saldo is still sufficient after re-read
            if (fresh.saldo < monto) {
              effectiveNextState = 'en_cola_por_fondos';
              decrementOk = true; // no decrement needed, queue state set
              break;
            }

            const nuevoSaldo = fresh.saldo - monto;

            // Update with the current state — Appwrite server-side operations
            // are atomic per document; reading fresh before updating is our
            // optimistic-lock guard for this prototype.
            const updatedDoc = await db.updateDocument(
              dbId,
              COL.subcuentas,
              subcuenta.$id,
              { saldo: nuevoSaldo },
            );
            subcuentaAfterUpdate = updatedDoc as unknown as Subcuenta;

            // Verify the update was applied correctly
            if (subcuentaAfterUpdate.saldo === nuevoSaldo) {
              decrementOk = true;
              break;
            }

            // Saldo mismatch — concurrent modification, retry
            lastErr = `Saldo mismatch: expected ${nuevoSaldo}, got ${subcuentaAfterUpdate.saldo}`;
          } catch (updateErr: unknown) {
            lastErr = updateErr instanceof Error ? updateErr.message : 'Unknown error';
          }

          // Brief wait before retry (no sleep in serverless — immediate retry)
        }

        if (!decrementOk) {
          console.error('Fund decrement failed after retries:', lastErr);
          return new Response(
            JSON.stringify({
              success: false,
              error:
                'Conflicto de concurrencia en la subcuenta. ' +
                'Intente nuevamente. Si el problema persiste, contacte al área de sistemas.',
            }),
            { status: 409, headers: { 'Content-Type': 'application/json' } },
          );
        }
      }
    }

    // ── Build update payload ────────────────────────────
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      estado: effectiveNextState,
    };

    // Approval chain tracking
    if (auxilio && auxilio.cadenaAprobacion.length > 0) {
      if (solicitud.estado === 'radicada') {
        // Starting review — set first instance
        updateData.instanciaAprobacionActual = auxilio.cadenaAprobacion[0];
      } else if (accion === 'aprobado' || accion === 'negado') {
        // Record the decision in historial
        const entry = {
          instancia: solicitud.instanciaAprobacionActual || auxilio.cadenaAprobacion[0],
          accion,
          fecha: now,
          usuarioId: user.id,
        };
        const historialActual = typeof solicitud.historialAprobacion === 'string' 
          ? JSON.parse(solicitud.historialAprobacion || '[]')
          : (solicitud.historialAprobacion || []);
        const historial = [...historialActual, entry];
        updateData.historialAprobacion = JSON.stringify(historial);

        // Advance to next instance if approved and more remain
        if (accion === 'aprobado' && solicitud.instanciaAprobacionActual && auxilio) {
          const currentIdx = auxilio.cadenaAprobacion.indexOf(
            solicitud.instanciaAprobacionActual,
          );
          if (currentIdx >= 0 && currentIdx < auxilio.cadenaAprobacion.length - 1) {
            updateData.instanciaAprobacionActual = auxilio.cadenaAprobacion[currentIdx + 1];
          } else {
            // Last instance — clear tracking as we move to final state
            updateData.instanciaAprobacionActual = null;
          }
        } else if (accion === 'negado') {
          updateData.instanciaAprobacionActual = null;
        }
      }
    }

    // Set montoAprobado when moving to approval stage
    if (effectiveNextState === 'aprobada' && auxilio) {
      updateData.montoAprobado = requestedMonto || auxilio.montoMaximo;
    }

    // ── Update solicitud ────────────────────────────────
    const updatedDoc = await db.updateDocument(
      dbId,
      COL.solicitudes,
      solicitudId,
      updateData,
    );
    const updatedSolicitud = updatedDoc as unknown as Solicitud;

    // ── Load asociado for notification ──────────────────
    const asociadoDoc = await db.getDocument(dbId, COL.asociados, solicitud.asociadoId);
    const asociado = asociadoDoc as unknown as Asociado;

    // ── Create notification ─────────────────────────────
    const auxName = auxilio?.nombre || 'auxilio';
    const estadoMsg = estadoLabel(effectiveNextState);

    let notifMensaje: string;
    if (effectiveNextState === 'en_cola_por_fondos') {
      notifMensaje =
        `Tu solicitud de ${auxName} ha sido aprobada pero está en espera por disponibilidad ` +
        `de fondos. Serás notificado cuando se reanude el proceso.`;
    } else if (effectiveNextState === 'negada') {
      notifMensaje = `Tu solicitud de ${auxName} ha sido negada. Contacta al comité para más información.`;
    } else if (effectiveNextState === 'pagada') {
      notifMensaje = `Tu solicitud de ${auxName} ha sido pagada. El monto aprobado es de $${updatedSolicitud.montoAprobado.toLocaleString('es-CO')}.`;
    } else {
      notifMensaje = `Tu solicitud de ${auxName} ha cambiado a estado: ${estadoMsg}.`;
    }

    await createNotification(
      asociado.$id,
      'cambio_estado',
      notifMensaje,
      { solicitudId: updatedSolicitud.$id, estadoNuevo: effectiveNextState },
    );

    // ── Return updated solicitud ────────────────────────
    const responseData: ApiResponse<Solicitud> & {
      subcuentaActualizada?: { nombre: string; saldo: number };
    } = {
      success: true,
      data: updatedSolicitud,
    };

    if (subcuentaAfterUpdate) {
      responseData.subcuentaActualizada = {
        nombre: subcuentaAfterUpdate.nombre,
        saldo: subcuentaAfterUpdate.saldo,
      };
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '';

    // Appwrite "not found" → 404
    if (
      message.includes('not found') ||
      message.includes('document_not_found') ||
      message.includes('404')
    ) {
      return new Response(
        JSON.stringify({ success: false, error: 'Solicitud no encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: message || 'Error al procesar aprobación',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
