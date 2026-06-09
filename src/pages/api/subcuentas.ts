// src/pages/api/subcuentas.ts
// GET /api/subcuentas — admin-only: returns all subcuentas with their balances.
// Session protection via middleware. Admin gate: 403 for non-admin users.
import type { APIRoute } from 'astro';
import { getDb, databaseId, eq, COL } from '../../lib/fmpi/db';
import type { Subcuenta, Asociado, ApiResponse } from '../../lib/fmpi/types';
import { getAdminUsers } from '../../lib/appwrite';

// ─── Admin guard ─────────────────────────────────────────

/**
 * Checks whether the authenticated user has admin privileges.
 *
 * Priority (first match wins, result cached on locals):
 *   1. DB `asociados.esAdmin` flag — persistent admin role
 *   2. ENV var `ADMIN_USER_IDS` — comma-separated list of Appwrite user $id values
 *   3. Appwrite user preference `role: 'admin'`
 *
 * Caches result on `locals.esAdmin` to avoid repeated DB lookups
 * per request. Callers should pass `locals` from the API route context.
 */
export async function isAdmin(locals: App.Locals): Promise<boolean> {
  // Priority 0: cached value from middleware or prior call
  if (locals.esAdmin === true) return true;

  const user = locals.user;
  if (!user) return false;

  // Priority 1: DB flag on asociados collection
  try {
    const db = getDb();
    const dbId = databaseId();
    const result = await db.listDocuments(dbId, COL.asociados, [eq('userId', user.id)]);
    if (result.documents.length > 0) {
      const asociado = result.documents[0] as unknown as Asociado;
      if (asociado.esAdmin === true) {
        locals.esAdmin = true;
        return true;
      }
    }
  } catch {
    // DB lookup failed — non-fatal; fall through
  }

  // Priority 2: env-based admin list
  const adminIdsRaw = import.meta.env.ADMIN_USER_IDS;
  if (adminIdsRaw) {
    const adminIds = adminIdsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (adminIds.includes(user.id)) {
      locals.esAdmin = true;
      return true;
    }
  }

  // Priority 3: Appwrite user preference
  try {
    const users = getAdminUsers();
    const prefs = await users.getPrefs(user.id);
    if ((prefs as Record<string, unknown>).role === 'admin') {
      locals.esAdmin = true;
      return true;
    }
  } catch {
    // Preference read failed — non-fatal; fall through to deny
  }

  locals.esAdmin = false;
  return false;
}

// ─── GET: list subcuentas ────────────────────────────────

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
    const result = await db.listDocuments(dbId, COL.subcuentas);

    // Map to Subcuenta type, sorting by name for consistent output
    const subcuentas = (result.documents as unknown as Subcuenta[])
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    return new Response(
      JSON.stringify({ success: true, data: subcuentas } satisfies ApiResponse<Subcuenta[]>),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al obtener subcuentas';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
