// src/pages/api/criterios.ts
// GET /api/criterios — admin-only: returns all criterios de ponderación.
// Session protection via middleware. Admin gate: 403 for non-admin users.
import type { APIRoute } from 'astro';
import { getDb, databaseId, COL } from '../../lib/fmpi/db';
import type { CriterioPonderacion, ApiResponse } from '../../lib/fmpi/types';
import { isAdmin } from './subcuentas';

// ─── GET: list criterios ─────────────────────────────────

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
    const result = await db.listDocuments(dbId, COL.criterios_ponderacion);

    const criterios = result.documents as unknown as CriterioPonderacion[];

    return new Response(
      JSON.stringify({
        success: true,
        data: criterios,
      } satisfies ApiResponse<CriterioPonderacion[]>),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al obtener criterios de ponderación';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
