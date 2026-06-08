import type { APIRoute } from 'astro';
import { loginUser } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('[Login API] Attempting login for:', email);

    if (!email || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Correo y contraseña son obligatorios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const result = await loginUser(email, password);

    console.log('[Login API] Result:', { success: result.success, hasUser: !!result.user, hasSession: !!result.session, error: result.error });

    if (!result.success || !result.user || !result.session) {
      return new Response(
        JSON.stringify({ success: false, error: result.error || 'Error al iniciar sesión' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }

    console.log('[Login API] Setting cookies for userId:', result.user.id);

    // ── Set httpOnly session cookie ──
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

    console.log('[Login API] Session cookie set, returning success');

    return new Response(
      JSON.stringify({ success: true, user: result.user }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[Login API] Error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
