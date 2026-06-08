import { Client, Databases, Users } from 'node-appwrite';

/** Create a fresh Appwrite client for each SSR request (serverless-safe). */
export function createClient(): Client {
  const client = new Client();
  client
    .setEndpoint(import.meta.env.APPWRITE_ENDPOINT!)
    .setProject(import.meta.env.APPWRITE_PROJECT_ID!);
  return client;
}

/** Create a client authenticated with a session secret (from cookie). */
export function createSessionClient(secret: string): Client {
  const client = createClient();
  client.setSession(secret);
  return client;
}

/**
 * Create an admin-level client using a server API key.
 * Use only for admin operations (user creation, listing, etc).
 * Requires APPWRITE_API_KEY in .env.
 */
export function createAdminClient(): Client {
  const client = createClient();
  client.setKey(import.meta.env.APPWRITE_API_KEY!);
  return client;
}

/** Create a Databases service client using the server API key. */
export function createDatabaseClient(): Databases {
  return new Databases(createAdminClient());
}

/** Convenience: get a Users service with admin privileges. */
export function getAdminUsers(): Users {
  return new Users(createAdminClient());
}
