// src/pages/api/asociados/me.ts
// GET /api/asociados/me — returns the authenticated user's asociado profile.
// Session protection via middleware. Returns 404 if no asociado record exists.
import type { APIRoute } from 'astro';
import { getDb, databaseId, eq } from '../../../lib/fmpi/db';
import type { Asociado, ApiResponse } from '../../../lib/fmpi/types';

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: 'No autorizado' } satisfies ApiResponse),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const db = getDb();
    const dbId = databaseId();

    const result = await db.listDocuments(dbId, 'asociados', [eq('userId', user.id)]);

    if (result.documents.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Perfil de asociado no encontrado' } satisfies ApiResponse),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const asociado = result.documents[0] as unknown as Asociado;

    return new Response(
      JSON.stringify({ success: true, data: asociado } satisfies ApiResponse<Asociado>),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    return new Response(
      JSON.stringify({ success: false, error: message } satisfies ApiResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
