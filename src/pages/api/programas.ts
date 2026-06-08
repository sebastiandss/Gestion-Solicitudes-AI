// src/pages/api/programas.ts
// GET /api/programas — returns all available programs (catalog).
// Session protection via middleware. No ownership filter — all authenticated users can read.
import type { APIRoute } from 'astro';
import { getDb, databaseId } from '../../lib/fmpi/db';
import type { Programa, ApiResponse } from '../../lib/fmpi/types';

export const GET: APIRoute = async () => {
  try {
    const db = getDb();
    const dbId = databaseId();

    const result = await db.listDocuments(dbId, 'programas');

    const programas = result.documents as unknown as Programa[];

    return new Response(
      JSON.stringify({ success: true, data: programas } satisfies ApiResponse<Programa[]>),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al obtener catálogo de programas';
    return new Response(
      JSON.stringify({ success: false, error: message } satisfies ApiResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
