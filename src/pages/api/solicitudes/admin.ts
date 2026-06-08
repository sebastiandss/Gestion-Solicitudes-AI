// src/pages/api/solicitudes/admin.ts
// GET /api/solicitudes/admin — admin-only: list all solicitudes, filterable by estado.
// Session protection via middleware. Admin gate: 403 for non-admin users.
import type { APIRoute } from 'astro';
import { getDb, databaseId, eq, desc, COL } from '../../../lib/fmpi/db';
import type { Solicitud, ApiResponse } from '../../../lib/fmpi/types';
import { isAdmin } from '../subcuentas';

// ─── GET: list all solicitudes (admin) ───────────────────

export const GET: APIRoute = async ({ locals, url }) => {
  const user = locals.user;
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: 'No autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Admin gate
  const admin = await isAdmin(user.id);
  if (!admin) {
    return new Response(
      JSON.stringify({ success: false, error: 'Acceso denegado: se requiere rol de administrador' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const db = getDb();
    const dbId = databaseId();

    // Optional estado filter via query param: ?estado=en_estudio
    const estadoFilter = url.searchParams.get('estado');
    const queries: string[] = [desc('fechaRadicacion')];
    if (estadoFilter) {
      queries.unshift(eq('estado', estadoFilter));
    }

    const result = await db.listDocuments(dbId, COL.solicitudes, queries);
    const solicitudes = result.documents as unknown as Solicitud[];

    return new Response(
      JSON.stringify({
        success: true,
        data: solicitudes,
        count: solicitudes.length,
      } satisfies ApiResponse<Solicitud[]> & { count: number }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al obtener solicitudes';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
