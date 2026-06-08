// src/pages/api/solicitudes/[id].ts
// GET    /api/solicitudes/{id}  — detail with ownership check
// DELETE /api/solicitudes/{id}  — delete only if estado is 'radicada'
import type { APIRoute } from 'astro';
import { getDb, databaseId, eq, COL, deserializeSolicitud } from '../../../lib/fmpi/db';
import type { Asociado, Solicitud, ApiResponse } from '../../../lib/fmpi/types';

// ─── Helpers ─────────────────────────────────────────────

/** Resolve asociadoId from session userId. Returns null if not found. */
async function resolveAsociadoId(userId: string): Promise<string | null> {
  const db = getDb();
  const dbId = databaseId();
  const result = await db.listDocuments(dbId, COL.asociados, [eq('userId', userId)]);
  if (result.documents.length === 0) return null;
  return result.documents[0].$id;
}

// ─── GET: solicitud detail ───────────────────────────────

export const GET: APIRoute = async ({ params, locals }) => {
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
    const db = getDb();
    const dbId = databaseId();

    const asociadoId = await resolveAsociadoId(user.id);
    if (!asociadoId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Perfil de asociado no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const doc = await db.getDocument(dbId, COL.solicitudes, solicitudId);
    const solicitud = deserializeSolicitud(doc) as unknown as Solicitud;

    // Ownership check — must match the authenticated user's asociadoId
    if (solicitud.asociadoId !== asociadoId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Solicitud no encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: solicitud } satisfies ApiResponse<Solicitud>),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    // Appwrite throws if document not found
    const message = err instanceof Error ? err.message : '';
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
        error: message || 'Error al obtener solicitud',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};

// ─── DELETE: only radicada solicitudes ───────────────────

export const DELETE: APIRoute = async ({ params, locals }) => {
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
    const db = getDb();
    const dbId = databaseId();

    const asociadoId = await resolveAsociadoId(user.id);
    if (!asociadoId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Perfil de asociado no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const doc = await db.getDocument(dbId, COL.solicitudes, solicitudId);
    const solicitud = doc as unknown as Solicitud;

    // Ownership check
    if (solicitud.asociadoId !== asociadoId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Solicitud no encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Only radicada solicitudes can be deleted
    if (solicitud.estado !== 'radicada') {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            'Solo se pueden eliminar solicitudes en estado "Radicada". ' +
            `Estado actual: ${solicitud.estado}.`,
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      );
    }

    await db.deleteDocument(dbId, COL.solicitudes, solicitudId);

    return new Response(
      JSON.stringify({ success: true, data: null }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '';
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
        error: message || 'Error al eliminar solicitud',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
