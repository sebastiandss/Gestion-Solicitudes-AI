// src/pages/api/beneficiarios/index.ts
// GET  /api/beneficiarios — list own beneficiaries
// POST /api/beneficiarios — create a new beneficiary linked to the current asociado
import type { APIRoute } from 'astro';
import { ID } from 'node-appwrite';
import { getDb, databaseId, eq, COL } from '../../../lib/fmpi/db';
import type { Asociado, Beneficiario, ApiResponse } from '../../../lib/fmpi/types';

// ─── GET: list own beneficiaries ────────────────────────

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

    // List beneficiaries for this asociado
    const result = await db.listDocuments(dbId, COL.beneficiarios, [
      eq('asociadoId', asociado.$id),
    ]);

    const beneficiarios = result.documents as unknown as Beneficiario[];

    return new Response(
      JSON.stringify({ success: true, data: beneficiarios } satisfies ApiResponse<Beneficiario[]>),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al obtener beneficiarios';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};

// ─── POST: create a new beneficiary ─────────────────────

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: 'No autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const body = await request.json();
    const { nombre, parentesco, cedula, fechaNacimiento } = body;

    // Validate required fields
    if (!nombre || !parentesco || !cedula) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Nombre, parentesco y cédula son obligatorios.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

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

    // Create beneficiary linked to this asociado
    const beneficiaryData = {
      asociadoId: asociado.$id,
      nombre: nombre.trim(),
      parentesco: parentesco.trim(),
      cedula: cedula.trim(),
      fechaNacimiento: fechaNacimiento || null,
    };

    const created = await db.createDocument(
      dbId,
      COL.beneficiarios,
      ID.unique(),
      beneficiaryData,
    );
    const beneficiario = created as unknown as Beneficiario;

    return new Response(
      JSON.stringify({ success: true, data: beneficiario } satisfies ApiResponse<Beneficiario>),
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al crear beneficiario';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
