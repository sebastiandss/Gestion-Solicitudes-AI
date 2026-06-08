import type { APIRoute } from 'astro';
import { logoutUser } from '../../../lib/auth';

export const POST: APIRoute = async ({ cookies }) => {
  const sessionCookie = cookies.get('appwrite_session');

  if (sessionCookie?.value) {
    // Decode session secret (it was encoded when set)
    const decodedSecret = decodeURIComponent(sessionCookie.value);
    await logoutUser(decodedSecret);
  }

  // Clear the cookies regardless
  cookies.delete('appwrite_session', { path: '/' });
  cookies.delete('appwrite_user_id', { path: '/' });

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
};
