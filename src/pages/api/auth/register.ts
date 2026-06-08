import type { APIRoute } from 'astro';
import { ID } from 'node-appwrite';
import { registerUser } from '../../../lib/auth';
import { getDb, databaseId } from '../../../lib/fmpi/db';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { email, password, name, cedula } = body;

    // ── Server-side validation ──
    if (!email || !password || !name || !cedula) {
      return new Response(
        JSON.stringify({ success: false, error: 'Todos los campos son obligatorios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ success: false, error: 'La contraseña debe tener al menos 8 caracteres' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // ── Register ──
    const result = await registerUser(email, password, name, cedula);

    if (!result.success || !result.user || !result.session) {
      return new Response(
        JSON.stringify({ success: false, error: result.error || 'Error al registrar' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // ── Create asociado profile in FMPI database ──
    try {
      const db = getDb();
      const dbId = databaseId();
      
      await db.createDocument(dbId, 'asociados', ID.unique(), {
        userId: result.user.id,
        cedula: cedula,
        nombre: name,
        estado: 'activo',
        estadoContribucion: 'al_dia',
        fechaAfiliacion: new Date().toISOString(),
        productosFecoomeva: [],
      });
      
      console.log('[Register] Asociado profile created for user:', result.user.id);
    } catch (asociadoErr) {
      console.error('[Register] Failed to create asociado profile:', asociadoErr);
      // No fallamos el registro si falla la creación del perfil
      // El usuario puede registrarse pero tendrá que contactar soporte
    }

    // ── Set httpOnly session cookie (auto-login after register) ──
    // Encode session secret to handle special characters
    const encodedSecret = encodeURIComponent(result.session.secret);
    cookies.set('appwrite_session', encodedSecret, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 días
    });

    // ── Set userId cookie for session verification ──
    cookies.set('appwrite_user_id', result.user.id, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return new Response(
      JSON.stringify({ success: true, user: result.user }),
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Register error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
