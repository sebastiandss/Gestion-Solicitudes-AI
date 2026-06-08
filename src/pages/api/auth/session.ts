import type { APIRoute } from 'astro';
import { getCurrentUser } from '../../../lib/auth';

export const GET: APIRoute = async ({ cookies }) => {
  const sessionCookie = cookies.get('appwrite_session');
  const userIdCookie = cookies.get('appwrite_user_id');

  if (!sessionCookie?.value) {
    return new Response(
      JSON.stringify({ authenticated: false }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Decode session secret (it was encoded when set)
  const decodedSecret = decodeURIComponent(sessionCookie.value);
  const user = await getCurrentUser(decodedSecret, userIdCookie?.value);

  if (!user) {
    cookies.delete('appwrite_session', { path: '/' });
    return new Response(
      JSON.stringify({ authenticated: false }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return new Response(
    JSON.stringify({ authenticated: true, user }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
};
