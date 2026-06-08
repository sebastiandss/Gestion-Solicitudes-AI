// src/pages/api/beneficiarios/[id].ts
// PUT    /api/beneficiarios/{id} — update a beneficiary (owner only)
// DELETE /api/beneficiarios/{id} — remove a beneficiary (owner only)
import type { APIRoute } from 'astro';
import { getDb, databaseId, eq, COL } from '../../../lib/fmpi/db';
import type { Asociado, Beneficiario, ApiResponse } from '../../../lib/fmpi/types';

// ─── PUT: update a beneficiary ──────────────────────────

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: 'No autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const beneficiaryId = params.id;
  if (!beneficiaryId) {
    return new Response(
      JSON.stringify({ success: false, error: 'ID de beneficiario requerido' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const body = await request.json();
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

    // Fetch the beneficiary
    const doc = await db.getDocument(dbId, COL.beneficiarios, beneficiaryId);
    const beneficiario = doc as unknown as Beneficiario;

    // Ownership check
    if (beneficiario.asociadoId !== asociado.$id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Beneficiario no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Build update payload — only set fields that were provided
    const updates: Record<string, string> = {};
    if (body.nombre !== undefined) updates.nombre = body.nombre.trim();
    if (body.parentesco !== undefined) updates.parentesco = body.parentesco.trim();
    if (body.cedula !== undefined) updates.cedula = body.cedula.trim();
    if (body.fechaNacimiento !== undefined) updates.fechaNacimiento = body.fechaNacimiento;

    const updated = await db.updateDocument(dbId, COL.beneficiarios, beneficiaryId, updates);
    const result = updated as unknown as Beneficiario;

    return new Response(
      JSON.stringify({ success: true, data: result } satisfies ApiResponse<Beneficiario>),
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
        JSON.stringify({ success: false, error: 'Beneficiario no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }
    return new Response(
      JSON.stringify({
        success: false,
        error: message || 'Error al actualizar beneficiario',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};

// ─── DELETE: remove a beneficiary ───────────────────────

export const DELETE: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: 'No autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const beneficiaryId = params.id;
  if (!beneficiaryId) {
    return new Response(
      JSON.stringify({ success: false, error: 'ID de beneficiario requerido' }),
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

    // Fetch the beneficiary
    const doc = await db.getDocument(dbId, COL.beneficiarios, beneficiaryId);
    const beneficiario = doc as unknown as Beneficiario;

    // Ownership check
    if (beneficiario.asociadoId !== asociado.$id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Beneficiario no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Delete the beneficiary
    await db.deleteDocument(dbId, COL.beneficiarios, beneficiaryId);

    return new Response(
      JSON.stringify({ success: true, data: null } satisfies ApiResponse),
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
        JSON.stringify({ success: false, error: 'Beneficiario no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }
    return new Response(
      JSON.stringify({
        success: false,
        error: message || 'Error al eliminar beneficiario',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
