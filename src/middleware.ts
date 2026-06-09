import { defineMiddleware } from 'astro:middleware';
import { getCurrentUser } from './lib/auth';
import { getDb, databaseId, eq } from './lib/fmpi/db';
import type { Asociado } from './lib/fmpi/types';

// Rutas que no requieren autenticación
const PUBLIC_ROUTES = new Set([
  '/login',
  '/api/auth/login',
  '/api/auth/register',
]);

// Prefijos de ruta que no requieren autenticación
const PUBLIC_PREFIXES = ['/api/auth/', '/_astro/', '/favicon'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect, locals } = context;
  const pathname = url.pathname;

  console.log('[Middleware] Path:', pathname);

  // ── Permitir rutas públicas ──
  if (PUBLIC_ROUTES.has(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    console.log('[Middleware] Public route, allowing');
    return next();
  }

  // ── Verificar sesión ──
  const sessionCookie = cookies.get('appwrite_session');
  const userIdCookie = cookies.get('appwrite_user_id');

  console.log('[Middleware] Cookies:', { 
    hasSession: !!sessionCookie?.value, 
    hasUserId: !!userIdCookie?.value 
  });

  if (!sessionCookie?.value || !userIdCookie?.value) {
    console.log('[Middleware] Missing cookies, redirecting to /login');
    // Para APIs no-auth, devolver 401 en vez de redirect
    if (pathname.startsWith('/api/')) {
      return new Response(
        JSON.stringify({ authenticated: false, error: 'No autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }
    return redirect('/login');
  }

  try {
    // Decode session secret (it was encoded when set)
    const decodedSecret = decodeURIComponent(sessionCookie.value);
    console.log('[Middleware] Verifying user with userId:', userIdCookie.value);
    const user = await getCurrentUser(decodedSecret, userIdCookie.value);

    if (!user) {
      console.log('[Middleware] getCurrentUser returned null');
      cookies.delete('appwrite_session', { path: '/' });
      cookies.delete('appwrite_user_id', { path: '/' });
      if (pathname.startsWith('/api/')) {
        return new Response(
          JSON.stringify({ authenticated: false, error: 'Sesión expirada' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return redirect('/login');
    }

    console.log('[Middleware] User verified:', user.email);

    // Poner datos del usuario a disposición de todas las páginas
    locals.user = user;

    // ── Enrich with FMPI asociado data ──
    try {
      const db = getDb();
      const dbId = databaseId();
      const result = await db.listDocuments(dbId, 'asociados', [eq('userId', user.id)]);
      if (result.documents.length > 0) {
        const asociado = result.documents[0] as unknown as Asociado;
        locals.estado = asociado.estado;
        locals.estadoContribucion = asociado.estadoContribucion;
        locals.esAdmin = asociado.esAdmin ?? false;
      }
    } catch {
      // asociados collection may not exist yet — non-fatal
    }

    return next();
  } catch {
    cookies.delete('appwrite_session', { path: '/' });
    return redirect('/login');
  }
});
