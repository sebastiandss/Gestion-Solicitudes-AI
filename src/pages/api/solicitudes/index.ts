// src/pages/api/solicitudes/index.ts
// GET  /api/solicitudes          — list own solicitudes, newest first
// POST /api/solicitudes          — create a new solicitud with full rule validation
import type { APIRoute } from 'astro';
import { ID } from 'node-appwrite';
import { getDb, databaseId, eq, desc, COL, deserializeSolicitud } from '../../../lib/fmpi/db';
import type { Asociado, Auxilio, Solicitud, ApiResponse } from '../../../lib/fmpi/types';
import {
  validateSolicitud,
  computeFechaVencimiento180,
} from '../../../lib/fmpi/rules';
import { createNotification } from '../../../lib/fmpi/db';

// ─── GET: list own solicitudes ───────────────────────────

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

    // List solicitudes for this asociado, newest first
    const result = await db.listDocuments(dbId, COL.solicitudes, [
      eq('asociadoId', asociado.$id),
      desc('fechaRadicacion'),
    ]);

    const solicitudes = result.documents.map(deserializeSolicitud) as unknown as Solicitud[];

    return new Response(
      JSON.stringify({ success: true, data: solicitudes } satisfies ApiResponse<Solicitud[]>),
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

// ─── POST: create a new solicitud ────────────────────────

/** Maps form tipoPrincipal to the auxilio catalog tipoPrincipal for lookup. */
const TIPO_PRINCIPAL_MAP: Record<string, string> = {
  Calamidad: 'Calamidad',
  Enfermedad: 'Salud',
  Natalidad: 'Salud',
  Fallecimiento: 'Fallecimiento',
};

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
    const {
      tipoPrincipal,
      tipoEvento,
      fechaEvento,
      descripcionEvento,
      auxilioId: explicitAuxilioId,
    } = body;

    if (!fechaEvento || !descripcionEvento) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Fecha del evento y descripción son obligatorios.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const db = getDb();
    const dbId = databaseId();

    // ── Resolve asociado ──
    const asociadoResult = await db.listDocuments(dbId, COL.asociados, [
      eq('userId', user.id),
    ]);
    if (asociadoResult.documents.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            'Perfil de asociado no encontrado. Contacte al área de afiliaciones.',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }
    const asociado = asociadoResult.documents[0] as unknown as Asociado;

    // ── Resolve auxilioId ──
    let resolvedAuxilioId = explicitAuxilioId || '';
    if (!resolvedAuxilioId && tipoPrincipal) {
      const catalogTipo = TIPO_PRINCIPAL_MAP[tipoPrincipal] || tipoPrincipal;
      const auxilioResult = await db.listDocuments(dbId, COL.auxilios, [
        eq('tipoPrincipal', catalogTipo),
      ]);
      if (auxilioResult.documents.length > 0) {
        // Pick first matching auxilio
        resolvedAuxilioId = auxilioResult.documents[0].$id;
      }
    }

    if (!resolvedAuxilioId) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            'No se pudo determinar el tipo de auxilio. Seleccione un tipo de evento válido.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // ── Fetch auxilio catalog entry ──
    const auxilioDoc = await db.getDocument(dbId, COL.auxilios, resolvedAuxilioId);
    const auxilio = auxilioDoc as unknown as Auxilio;

    // ── Fetch existing solicitudes for duplicate check ──
    const existingResult = await db.listDocuments(dbId, COL.solicitudes, [
      eq('asociadoId', asociado.$id),
    ]);
    const existingSolicitudes = existingResult.documents as unknown as Solicitud[];

    // ── Run business rules ──
    const validation = validateSolicitud({
      asociado,
      auxilio,
      fechaEvento,
      existingSolicitudes,
    });

    if (!validation.valid) {
      // Determine appropriate status code
      let status = 422;
      const errorText = validation.errors.join(' ');
      if (errorText.includes('suspendido') || errorText.includes('moroso')) {
        status = 403;
      } else if (errorText.includes('Ya existe una solicitud')) {
        status = 409;
      }
      return new Response(
        JSON.stringify({
          success: false,
          error: validation.errors.join(' '),
          details: validation.errors,
        }),
        { status, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // ── Create solicitud ──
    const now = new Date().toISOString();
    const fechaVencimiento180 = computeFechaVencimiento180(fechaEvento);

    const solicitudData = {
      asociadoId: asociado.$id,
      auxilioId: resolvedAuxilioId,
      fechaEvento,
      fechaRadicacion: now,
      fechaVencimiento180,
      descripcion: descripcionEvento,
      estado: 'radicada',
      montoAprobado: 0,
      instanciaAprobacionActual: null,
      historialAprobacion: JSON.stringify([]),
      analisisIARiesgo: null,
    };

    const created = await db.createDocument(
      dbId,
      COL.solicitudes,
      ID.unique(),
      solicitudData,
    );
    const solicitud = created as unknown as Solicitud;

    // ── Create notification ──
    await createNotification(
      asociado.$id,
      'nueva_solicitud',
      `Solicitud de ${auxilio.nombre} radicada exitosamente. En espera de evaluación.`,
      { solicitudId: solicitud.$id },
    );

    return new Response(
      JSON.stringify({ success: true, data: solicitud } satisfies ApiResponse<Solicitud>),
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Error interno al crear solicitud';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
