// src/pages/api/subcuentas.ts
// GET /api/subcuentas — admin-only: returns all subcuentas with their balances.
// Session protection via middleware. Admin gate: 403 for non-admin users.
import type { APIRoute } from 'astro';
import { getDb, databaseId, COL } from '../../lib/fmpi/db';
import type { Subcuenta, ApiResponse } from '../../lib/fmpi/types';

// ─── Admin guard ─────────────────────────────────────────

/**
 * Checks whether the authenticated user has admin privileges.
 *
 * Two mechanisms (either suffices):
 *   1. ENV var `ADMIN_USER_IDS` — comma-separated list of Appwrite user $id values.
 *   2. Appwrite user preference `role: 'admin'`.
 *
 * Rationale: no formal RBAC yet; simple prototype guard that covers
 * both explicit user-ID listing and self-serve admin toggling.
 */
export async function isAdmin(userId: string): Promise<boolean> {
  // Check 1: env-based admin list
  const adminIdsRaw = import.meta.env.ADMIN_USER_IDS;
  if (adminIdsRaw) {
    const adminIds = adminIdsRaw.split(',').map((s) => s.trim()).filter(Boolean);
    if (adminIds.includes(userId)) return true;
  }

  // Check 2: Appwrite user preference
  try {
    const { Account } = await import('node-appwrite');
    const { createAdminClient } = await import('../../lib/appwrite');
    const client = createAdminClient();
    const account = new Account(client);
    // We can't call account.get() with another user's session without a session.
    // Instead use the Users service to read prefs (already available via getAdminUsers).
    const { getAdminUsers } = await import('../../lib/appwrite');
    const users = getAdminUsers();
    const prefs = await users.getPrefs(userId);
    if ((prefs as Record<string, unknown>).role === 'admin') return true;
  } catch {
    // Preference read failed — non-fatal; fall through to deny
  }

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
