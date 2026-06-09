// src/pages/api/asociados/index.ts
// GET /api/asociados — admin-only: returns all asociados (name, cedula, esAdmin).
// Session protection via middleware. Admin gate: 403 for non-admin users.
import type { APIRoute } from 'astro';
import { getDb, databaseId, COL } from '../../../lib/fmpi/db';
import type { Asociado, ApiResponse } from '../../../lib/fmpi/types';
import { isAdmin } from '../subcuentas';

export const GET: APIRoute = async ({ locals }) => {
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
      JSON.stringify({ success: false, error: 'Acceso denegado: se requiere rol de administrador' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const db = getDb();
    const dbId = databaseId();
    const result = await db.listDocuments(dbId, COL.asociados);

    const asociados = result.documents as unknown as Asociado[];

    return new Response(
      JSON.stringify({
        success: true,
        data: asociados,
      } satisfies ApiResponse<Asociado[]>),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al obtener asociados';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
