// src/pages/api/solicitudes/[id]/analizar.ts
// Secure AI proxy: session protected (middleware), server-side API key only.
// Ownership check: only the solicitud owner can request AI analysis.
import type { APIRoute } from 'astro';
import { getDb, databaseId, eq, COL } from '../../../../lib/fmpi/db';
import type { Asociado, Solicitud } from '../../../../lib/fmpi/types';

/** Resolve asociadoId from session userId. Returns null if not found. */
async function resolveAsociadoId(userId: string): Promise<string | null> {
  const db = getDb();
  const dbId = databaseId();
  const result = await db.listDocuments(dbId, COL.asociados, [eq('userId', userId)]);
  if (result.documents.length === 0) return null;
  return result.documents[0].$id;
}

export const POST: APIRoute = async ({ request, params, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'No autorizado' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const solicitudId = params.id;
  if (!solicitudId) {
    return new Response(
      JSON.stringify({ error: 'ID de solicitud requerido' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const body = await request.json();
    const { name, descripcion } = body;

    if (!descripcion || !name) {
      return new Response(
        JSON.stringify({ error: 'Datos de solicitud incompletos' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // ── Ownership check ──────────────────────────────────
    const db = getDb();
    const dbId = databaseId();

    const asociadoId = await resolveAsociadoId(user.id);
    if (!asociadoId) {
      return new Response(
        JSON.stringify({ error: 'Perfil de asociado no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    let solicitud: Solicitud;
    try {
      const doc = await db.getDocument(dbId, COL.solicitudes, solicitudId);
      solicitud = doc as unknown as Solicitud;
    } catch {
      return new Response(
        JSON.stringify({ error: 'Solicitud no encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (solicitud.asociadoId !== asociadoId) {
      return new Response(
        JSON.stringify({ error: 'Solicitud no encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // ── DeepSeek AI proxy ────────────────────────────────
    const apiKey = import.meta.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API Key no configurada en el servidor' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              'Eres un estricto auditor del comité de evaluación de auxilios cooperativos de BeneficIA. Se te proporciona la descripción de una solicitud de auxilio. Tu tarea es encontrar las razones concretas por las cuales esta solicitud ES ALTAMENTE RIESGOSA y SERÁ RECHAZADA. Identifica fallas lógicas, falta explícita de justificación gravosa, falta de contundencia u omisiones de detalles clave que todo comité exige. Responde en un solo párrafo corto y MUY DIRECTO indicando el motivo por el cual no procede. NO uses etiquetas markdown como asteriscos, hashtags o subrayados.',
          },
          {
            role: 'user',
            content: `Tipo de auxilio: ${name}. Descripción del usuario: ${descripcion}`,
          },
        ],
        temperature: 0.4,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return new Response(
        JSON.stringify({ error: data.error.message || 'Error del servicio de IA' }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const iaText = data.choices[0].message.content;
    // Strip markdown characters (same as original client-side logic)
    const cleanText = iaText.replace(/[*_#`~>]/g, '');

    // Persist AI analysis to the solicitud record
    try {
      await db.updateDocument(dbId, COL.solicitudes, solicitudId, {
        analisisIARiesgo: cleanText,
      });
    } catch {
      // Non-fatal: analysis still returned to client even if persist fails
    }

    return new Response(
      JSON.stringify({ analysis: cleanText }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};
