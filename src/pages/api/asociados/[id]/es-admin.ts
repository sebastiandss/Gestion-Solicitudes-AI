// src/pages/api/asociados/[id]/es-admin.ts
// PATCH /api/asociados/{id}/es-admin — admin-only: toggle esAdmin flag on an asociado.
// Guarded: caller must be an existing admin. Body: { esAdmin: boolean }.
import type { APIRoute } from 'astro';
import { getDb, databaseId } from '../../../../lib/fmpi/db';
import type { Asociado, ApiResponse } from '../../../../lib/fmpi/types';
import { isAdmin } from '../../subcuentas';

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: 'No autorizado' } satisfies ApiResponse),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Admin gate — only existing admins can promote/demote
  const admin = await isAdmin(locals);
  if (!admin) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Acceso denegado: se requiere rol de administrador para modificar permisos.',
      } satisfies ApiResponse),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const targetId = params.id;
  if (!targetId) {
    return new Response(
      JSON.stringify({ success: false, error: 'ID de asociado requerido' } satisfies ApiResponse),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const esAdmin: unknown = body.esAdmin;

    if (typeof esAdmin !== 'boolean') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'El campo "esAdmin" debe ser un booleano (true o false).',
        } satisfies ApiResponse),
        { status: 422, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const db = getDb();
    const dbId = databaseId();

    // Load asociado document
    const doc = await db.getDocument(dbId, 'asociados', targetId);
    const asociado = doc as unknown as Asociado;

    // Update esAdmin
    const updatedDoc = await db.updateDocument(dbId, 'asociados', targetId, {
      esAdmin,
    });
    const updated = updatedDoc as unknown as Asociado;

    return new Response(
      JSON.stringify({
        success: true,
        data: { $id: updated.$id, nombre: updated.nombre, esAdmin: updated.esAdmin },
      } satisfies ApiResponse<{ $id: string; nombre: string; esAdmin: boolean }>),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '';

    // Appwrite "not found" → 404
    if (
      message.includes('not found') ||
      message.includes('document_not_found') ||
      message.includes('404')
    ) {
      return new Response(
        JSON.stringify({ success: false, error: 'Asociado no encontrado' } satisfies ApiResponse),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: message || 'Error al actualizar permisos de administrador',
      } satisfies ApiResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
