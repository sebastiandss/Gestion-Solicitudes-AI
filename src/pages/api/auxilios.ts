// src/pages/api/auxilios.ts
// GET /api/auxilios — returns all auxilio types (catalog).
// Session protection via middleware. No ownership filter — all authenticated users can read.
import type { APIRoute } from 'astro';
import { getDb, databaseId } from '../../lib/fmpi/db';
import type { Auxilio, ApiResponse } from '../../lib/fmpi/types';

export const GET: APIRoute = async () => {
  try {
    const db = getDb();
    const dbId = databaseId();

    const result = await db.listDocuments(dbId, 'auxilios');

    const auxilios = result.documents as unknown as Auxilio[];

    return new Response(
      JSON.stringify({ success: true, data: auxilios } satisfies ApiResponse<Auxilio[]>),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al obtener catálogo de auxilios';
    return new Response(
      JSON.stringify({ success: false, error: message } satisfies ApiResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
