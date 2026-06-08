// src/pages/api/notificaciones/[id]/read.ts
// PUT /api/notificaciones/{id}/read — mark notification as read (owner only)
import type { APIRoute } from 'astro';
import { getDb, databaseId, eq, COL } from '../../../../lib/fmpi/db';
import type { Asociado, Notificacion, ApiResponse } from '../../../../lib/fmpi/types';

export const PUT: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: 'No autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const notificationId = params.id;
  if (!notificationId) {
    return new Response(
      JSON.stringify({ success: false, error: 'ID de notificación requerido' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const db = getDb();
    const dbId = databaseId();

    // Resolve asociado by userId
    const asociadoResult = await db.listDocuments(dbId, COL.asociados, [eq('userId', user.id)]);
    if (asociadoResult.documents.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Perfil de asociado no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }
    const asociado = asociadoResult.documents[0] as unknown as Asociado;

    // Fetch the notification
    const doc = await db.getDocument(dbId, COL.notificaciones, notificationId);
    const notificacion = doc as unknown as Notificacion;

    // Ownership check — must belong to the authenticated user's asociado
    if (notificacion.asociadoId !== asociado.$id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Notificación no encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Mark as read (no-op if already read)
    if (!notificacion.leida) {
      await db.updateDocument(dbId, COL.notificaciones, notificationId, {
        leida: true,
      });
    }

    return new Response(
      JSON.stringify({ success: true, data: { ...notificacion, leida: true } } satisfies ApiResponse),
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
        JSON.stringify({ success: false, error: 'Notificación no encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }
    return new Response(
      JSON.stringify({
        success: false,
        error: message || 'Error al marcar notificación como leída',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
