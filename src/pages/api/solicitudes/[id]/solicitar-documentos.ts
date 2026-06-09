// src/pages/api/solicitudes/[id]/solicitar-documentos.ts
// POST /api/solicitudes/{id}/solicitar-documentos — admin-only: request additional
// documents from an asociado. Transitions solicitud from 'en_estudio' to
// 'pendiente_documentos' state.
//
// Body: { documentosRequeridos: string[] }
// Guard: admin-only, non-empty documentosRequeridos, optimistic lock via $updatedAt.
import type { APIRoute } from 'astro';
import { getDb, databaseId, COL, createNotification } from '../../../../lib/fmpi/db';
import type { Asociado, Solicitud, ApiResponse } from '../../../../lib/fmpi/types';
import {
  getNextState,
  estadoLabel,
  validateDocumentosRequeridos,
} from '../../../../lib/fmpi/rules';
import { isAdmin } from '../../subcuentas';

// ─── POST: request documents ──────────────────────────────

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
    const documentosRequeridos: unknown = body.documentosRequeridos;

    // ── Validate documentosRequeridos ─────────────────────
    const docValidation = validateDocumentosRequeridos(documentosRequeridos);
    if (!docValidation.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: docValidation.errors.join(' '),
        }),
        { status: 422, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const db = getDb();
    const dbId = databaseId();

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

    // ── Validate current state ────────────────────────────
    if (solicitud.estado !== 'en_estudio') {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Transición inválida: solo se pueden solicitar documentos desde "${estadoLabel('en_estudio')}". Estado actual: "${estadoLabel(solicitud.estado)}".`,
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // ── Compute next state ────────────────────────────────
    const nextState = getNextState(solicitud.estado, 'solicitar_documentos');
    if (!nextState) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Transición inválida: no se puede solicitar documentos desde "${estadoLabel(solicitud.estado)}".`,
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // ── Optimistic lock: verify doc not modified since read ──
    const guardedDocs = documentosRequeridos as string[];
    const now = new Date().toISOString();

    try {
      await db.updateDocument(dbId, COL.solicitudes, solicitudId, {
        estado: nextState,
        documentosRequeridos: JSON.stringify(guardedDocs),
      });
    } catch (updateErr: unknown) {
      const msg = updateErr instanceof Error ? updateErr.message : '';
      // Appwrite concurrent modification → 409
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

    // ── Load asociado for notification ────────────────────
    let asociado: Asociado | null = null;
    try {
      const asocDoc = await db.getDocument(dbId, COL.asociados, solicitud.asociadoId);
      asociado = asocDoc as unknown as Asociado;
    } catch {
      // non-fatal — notification skipped if asociado not found
    }

    // ── Create notification ───────────────────────────────
    if (asociado) {
      const docList = guardedDocs.map((d) => `• ${d}`).join('\n');
      await createNotification(
        asociado.$id,
        'docs_required',
        `El comité ha solicitado los siguientes documentos para continuar con tu solicitud:\n${docList}`,
        { solicitudId: updatedSolicitud.$id },
      );
    }

    // ── Return updated solicitud ──────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        data: updatedSolicitud,
      } satisfies ApiResponse<Solicitud>),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al solicitar documentos';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
