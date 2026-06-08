// src/lib/fmpi/db.ts
// Appwrite Databases client wrapper for the FMPI database.
// All operations go through the server API key — never exposed to the browser.
import { Databases, ID, Query } from 'node-appwrite';
import { createDatabaseClient } from '../appwrite';
import type { Notificacion } from './types';

// ─── Database helpers ──────────────────────────────────

/** Returns the FMPI database ID from environment. */
export function databaseId(): string {
  return import.meta.env.APPWRITE_DATABASE_ID!;
}

/** Returns a fresh admin-level Databases client. */
export function getDb(): Databases {
  return createDatabaseClient();
}

/** Shorthand: get a collection reference within the FMPI database. */
export function collection(name: string): { db: string; col: string } {
  return { db: databaseId(), col: name };
}

// ─── Collection name constants ─────────────────────────

export const COL = {
  asociados: 'asociados',
  beneficiarios: 'beneficiarios',
  auxilios: 'auxilios',
  solicitudes: 'solicitudes',
  contribuciones: 'contribuciones',
  subcuentas: 'subcuentas',
  notificaciones: 'notificaciones',
  programas: 'programas',
  criterios_ponderacion: 'criterios_ponderacion',
} as const;

// ─── Query helpers ─────────────────────────────────────

/** Build an equality query filter. */
export function eq(field: string, value: string): string {
  return Query.equal(field, value);
}

/** Build a descending order query. */
export function desc(field: string): string {
  return Query.orderDesc(field);
}

/** Build an ascending order query. */
export function asc(field: string): string {
  return Query.orderAsc(field);
}

// ─── Notification helper ───────────────────────────────

/**
 * Create a notification for an asociado.
 * Returns the created document or throws.
 */
export async function createNotification(
  asociadoId: string,
  tipo: string,
  mensaje: string,
  metadata: Record<string, string> | null = null,
): Promise<Notificacion> {
  const db = getDb();
  const { db: dbId, col } = collection(COL.notificaciones);

  const doc = await db.createDocument(dbId, col, ID.unique(), {
    asociadoId,
    tipo,
    mensaje,
    leida: false,
    fecha: new Date().toISOString(),
    metadata: metadata ? JSON.stringify(metadata) : null,
  });

  return deserializeNotificacion(doc as any);
}

// ─── Deserialization helpers ───────────────────────────

/** Deserialize JSON string fields in a Solicitud document. */
export function deserializeSolicitud(doc: any): any {
  if (!doc) return doc;
  return {
    ...doc,
    historialAprobacion: doc.historialAprobacion 
      ? JSON.parse(doc.historialAprobacion) 
      : [],
  };
}

/** Deserialize JSON string fields in a Notificacion document. */
export function deserializeNotificacion(doc: any): any {
  if (!doc) return doc;
  return {
    ...doc,
    metadata: doc.metadata ? JSON.parse(doc.metadata) : null,
  };
}
