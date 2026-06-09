// src/pages/api/solicitudes/[id]/entregar-documentos.ts
// POST /api/solicitudes/{id}/entregar-documentos — asociado-only: deliver requested
// documents. Transitions solicitud from 'pendiente_documentos' back to 'en_estudio'.
//
// Body: { documentosEntregados?: string[] }
// Guard: solicitud ownership, set-compare (no-op if unchanged), optimistic lock.
import type { APIRoute } from 'astro';
import { getDb, databaseId, eq, COL, createNotification } from '../../../../lib/fmpi/db';
import type { Asociado, Solicitud, ApiResponse } from '../../../../lib/fmpi/types';
import { getNextState, estadoLabel } from '../../../../lib/fmpi/rules';

// ─── POST: deliver documents ──────────────────────────────

export const POST: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: 'No autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
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
    const incomingDocs: unknown = body.documentosEntregados;

    const db = getDb();
    const dbId = databaseId();

    // ── Resolve asociado ──────────────────────────────────
    const asocResult = await db.listDocuments(dbId, COL.asociados, [eq('userId', user.id)]);
    if (asocResult.documents.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Perfil de asociado no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }
    const asociado = asocResult.documents[0] as unknown as Asociado;

    // ── Load solicitud ────────────────────────────────────
    let doc;
    try {
      doc = await db.getDocument(dbId, COL.solicitudes, solicitudId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('not found') || msg.includes('document_not_found') || msg.includes('404')) {
        return new Response(
          JSON.stringify({ success: false, error: 'Solicitud no encontrada' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } },
        );
      }
      throw err;
    }
    const solicitud = doc as unknown as Solicitud;

    // ── Verify ownership ──────────────────────────────────
    if (solicitud.asociadoId !== asociado.$id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Acceso denegado: esta solicitud no te pertenece.',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // ── Validate current state ────────────────────────────
    if (solicitud.estado !== 'pendiente_documentos') {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Esta solicitud no está en estado "${estadoLabel('pendiente_documentos')}". Estado actual: "${estadoLabel(solicitud.estado)}".`,
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // ── Set-compare guard: normalize incoming docs ────────
    const normalizedIncoming: string[] = Array.isArray(incomingDocs)
      ? incomingDocs
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          .map((s) => s.trim())
      : [];

    // Read current documentosEntregados
    const currentDocs: string[] = typeof solicitud.documentosEntregados === 'string'
      ? JSON.parse(solicitud.documentosEntregados || '[]')
      : (Array.isArray(solicitud.documentosEntregados) ? solicitud.documentosEntregados : []);

    // No-op if documents haven't changed
    const currentSet = new Set(currentDocs);
    const incomingSet = new Set(normalizedIncoming);

    if (incomingSet.size === currentSet.size && [...incomingSet].every((d) => currentSet.has(d))) {
      return new Response(
        JSON.stringify({
          success: true,
          data: solicitud,
          message: 'Los documentos ya fueron entregados anteriormente. No se realizaron cambios.',
        } satisfies ApiResponse<Solicitud> & { message: string }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // ── Compute next state ────────────────────────────────
    const nextState = getNextState(solicitud.estado, 'entregar_documentos');
    if (!nextState) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Transición inválida: no se pueden entregar documentos desde "${estadoLabel(solicitud.estado)}".`,
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // ── Update solicitud ──────────────────────────────────
    try {
      await db.updateDocument(dbId, COL.solicitudes, solicitudId, {
        estado: nextState,
        documentosEntregados: JSON.stringify(normalizedIncoming),
      });
    } catch (updateErr: unknown) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            'Conflicto de concurrencia: la solicitud fue modificada por otro proceso. ' +
            'Intente nuevamente.',
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Re-read updated solicitud
    const updatedDoc = await db.getDocument(dbId, COL.solicitudes, solicitudId);
    const updatedSolicitud = updatedDoc as unknown as Solicitud;

    // ── Create notification ───────────────────────────────
    await createNotification(
      asociado.$id,
      'docs_entregados',
      'Tus documentos han sido recibidos. La solicitud ha vuelto a estado de estudio para re-evaluación por el comité.',
      { solicitudId: updatedSolicitud.$id },
    );

    // ── Return updated solicitud ──────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        data: updatedSolicitud,
      } satisfies ApiResponse<Solicitud>),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al entregar documentos';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
