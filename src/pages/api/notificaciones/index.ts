// src/pages/api/notificaciones/index.ts
// GET /api/notificaciones — list own notifications, newest first
import type { APIRoute } from 'astro';
import { getDb, databaseId, eq, desc, COL, deserializeNotificacion } from '../../../lib/fmpi/db';
import type { Asociado, Notificacion, ApiResponse } from '../../../lib/fmpi/types';

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: 'No autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
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

    // List notifications for this asociado, newest first
    const result = await db.listDocuments(dbId, COL.notificaciones, [
      eq('asociadoId', asociado.$id),
      desc('fecha'),
    ]);

    const notificaciones = result.documents.map(deserializeNotificacion) as unknown as Notificacion[];

    return new Response(
      JSON.stringify({ success: true, data: notificaciones } satisfies ApiResponse<Notificacion[]>),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al obtener notificaciones';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
