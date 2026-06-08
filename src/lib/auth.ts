import { Account, ID } from 'node-appwrite';
import type { Models } from 'node-appwrite';
import { createClient, createSessionClient, getAdminUsers } from './appwrite';

// ─── Types ───────────────────────────────────────────

export interface UserData {
  id: string;
  email: string;
  name: string;
  cedula: string;
  initials: string;
  createdAt: string;
}

export interface AuthResult {
  success: boolean;
  user?: UserData;
  error?: string;
}

// ─── Helpers ─────────────────────────────────────────

function computeInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function mapUser(user: Models.User<Models.Preferences>, prefs: Models.Preferences): UserData {
  const cedula = (prefs?.cedula as string) || '';
  return {
    id: user.$id,
    email: user.email,
    name: user.name,
    cedula,
    initials: computeInitials(user.name),
    createdAt: user.$createdAt,
  };
}

// ─── Auth Operations ──────────────────────────────────

/**
 * Register a new user and create an active session.
 * Cedula is stored in user preferences after account creation.
 */
export async function registerUser(
  email: string,
  password: string,
  name: string,
  cedula: string,
): Promise<AuthResult & { session?: Models.Session }> {
  try {
    // 1. Create user and set prefs via admin API (bypasses guest scope restrictions)
    const users = getAdminUsers();
    // Usamos objeto para no enviar phone (no lo necesitamos)
    const newUser = await users.create({
      userId: ID.unique(),
      email,
      password,
      name,
    });

    // 2. Store cédula in prefs
    await users.updatePrefs(newUser.$id, { cedula });

    // 3. Create session via admin API (no guest scope needed)
    const session = await users.createSession(newUser.$id);

    // 4. Fetch full user data with session
    const client = createSessionClient(session.secret);
    const account = new Account(client);
    const user = await account.get();
    const prefs = await account.getPrefs();

    return { success: true, user: mapUser(user, prefs), session };
  } catch (err: unknown) {
    const message = extractAppwriteError(err, 'Error al registrar usuario');
    return { success: false, error: message };
  }
}

/**
 * Login with email + password.
 * Returns the session object so the caller can persist it.
 * Uses Admin API to create session (SDK 1.9.5 + Server 1.8.1 doesn't return secret via client API).
 */
export async function loginUser(
  email: string,
  password: string,
): Promise<AuthResult & { session?: Models.Session }> {
  try {
    // 1. First verify credentials via client API (this validates email/password)
    const client = createClient();
    const account = new Account(client);
    await account.createEmailPasswordSession(email, password);

    // 2. Get user via admin API
    const users = getAdminUsers();
    const { Query } = await import('node-appwrite');
    const userList = await users.list([Query.equal('email', email)]);
    
    if (userList.total === 0) {
      return { success: false, error: 'No se encontró una cuenta con este correo' };
    }
    
    const appwriteUser = userList.users[0];
    
    // 3. Create session via admin API (returns secret properly)
    const session = await users.createSession(appwriteUser.$id);
    
    // 4. Get prefs
    const prefs = await users.getPrefs(appwriteUser.$id);

    return { success: true, user: mapUser(appwriteUser, prefs), session };
  } catch (err: unknown) {
    const message = extractAppwriteError(err, 'Credenciales inválidas');
    return { success: false, error: message };
  }
}

/**
 * Verify and return the current user from a stored session secret.
 * Uses the userId from cookie to fetch data via admin API.
 */
export async function getCurrentUser(secret: string, userId?: string): Promise<UserData | null> {
  try {
    if (!userId) {
      console.warn('[getCurrentUser] No userId provided');
      return null;
    }
    
    const users = getAdminUsers();
    const user = await users.get(userId);
    const prefs = await users.getPrefs(userId);
    
    return mapUser(user, prefs);
  } catch (err) {
    console.error('[getCurrentUser] Failed for userId:', userId, '— Error:', err);
    return null;
  }
}

/**
 * Delete the current Appwrite session (logout).
 * Uses admin API to bypass guest scope restrictions.
 */
export async function logoutUser(secret: string): Promise<void> {
  try {
    const { Account } = await import('node-appwrite');
    const client = createSessionClient(secret);
    const account = new Account(client);
    
    // Get session to find user ID and session ID
    const session = await account.getSession('current');
    const sessionId = session.$id;
    const userId = session.userId;
    
    // Delete session via admin API
    const users = getAdminUsers();
    await users.deleteSession(userId, sessionId);
  } catch {
    // Session already expired or invalid — no-op
  }
}

// ─── Helpers ──────────────────────────────────────────

function extractAppwriteError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    // Appwrite throws AppwriteException with a `message` and `type`
    const type = e.type as string | undefined;
    const message = e.message as string | undefined;
    const code = e.code as number | undefined;

    // Log full error for debugging
    console.error('[Auth Error]', { type, message, code, full: e });

    // Map common Appwrite error types to user-friendly Spanish messages
    if (type === 'user_already_exists') return 'Ya existe una cuenta con este correo electrónico';
    if (type === 'user_invalid_credentials') return 'Credenciales inválidas. Verifica tu correo y contraseña';
    if (type === 'user_not_found') return 'No se encontró una cuenta con este correo';
    if (type === 'general_argument_invalid') return message || 'Datos inválidos. Revisa los campos e intenta de nuevo';
    if (type === 'user_session_already_exists') return 'Ya tienes una sesión activa';
    if (type === 'general_unauthorized_scope' || type === 'user_missing_scopes' || message?.includes('missing scopes')) {
      return 'Error de permisos en Appwrite. Verifica que APPWRITE_API_KEY tenga los scopes necesarios (users.read, users.write, databases.read, databases.write)';
    }

    if (message?.toLowerCase().includes('password')) {
      return 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número';
    }
    if (message?.toLowerCase().includes('email')) {
      return 'El correo electrónico no es válido';
    }

    return message || fallback;
  }
  return fallback;
}
