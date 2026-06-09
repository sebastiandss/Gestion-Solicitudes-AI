// src/lib/fmpi/types.ts
// Shared TypeScript interfaces for FMPI database collections.
// Matches the collection schema from sdd/fmpi-database/design.

/** Estado del asociado en el fondo. */
export type EstadoAsociado = 'activo' | 'suspendido';

/** Estado de contribuciones del asociado. */
export type EstadoContribucion = 'al_dia' | 'moroso';

/** Estados posibles de una solicitud (state machine). */
export type EstadoSolicitud =
  | 'radicada'
  | 'en_estudio'
  | 'en_aprobacion'
  | 'aprobada'
  | 'en_pago'
  | 'pagada'
  | 'negada'
  | 'en_cola_por_fondos'
  | 'pendiente_documentos';

/** Acción de aprobación en el historial. */
export type AccionAprobacion = 'aprobado' | 'negado';

/** Acción en el historial de aprobación. */
export interface HistorialAprobacionEntry {
  instancia: string;
  accion: AccionAprobacion;
  fecha: string; // ISO UTC
  usuarioId: string;
}

// ─── Collection interfaces ─────────────────────────────

/** `asociados` collection — links Appwrite auth to FMPI membership data. */
export interface Asociado {
  $id: string;
  userId: string;
  cedula: string;
  nombre: string;
  estado: EstadoAsociado;
  estadoContribucion: EstadoContribucion;
  fechaAfiliacion: string; // ISO UTC
  productosFecoomeva: string[];
  esAdmin: boolean;
}

/** `beneficiarios` collection — beneficiaries linked to an asociado. */
export interface Beneficiario {
  $id: string;
  asociadoId: string;
  nombre: string;
  parentesco: string;
  cedula: string;
  fechaNacimiento: string; // ISO UTC
}

/** `auxilios` collection — catalog of available auxilio types. */
export interface Auxilio {
  $id: string;
  codigo: string;
  nombre: string;
  montoMaximo: number;
  tiempoEsperaDias: number;
  cadenaAprobacion: string[];
  requierePonderacion: boolean;
  tipoPrincipal: string;
}

/** `solicitudes` collection — member requests. */
export interface Solicitud {
  $id: string;
  asociadoId: string;
  auxilioId: string;
  fechaEvento: string; // ISO UTC
  fechaRadicacion: string; // ISO UTC
  fechaVencimiento180: string; // ISO UTC
  descripcion: string;
  estado: EstadoSolicitud;
  montoAprobado: number;
  instanciaAprobacionActual: string | null;
  historialAprobacion: HistorialAprobacionEntry[];
  analisisIARiesgo: string | null;
  documentosRequeridos: string[];
  documentosEntregados: string[];
}

/** `contribuciones` collection — contribution history. */
export interface Contribucion {
  $id: string;
  asociadoId: string;
  periodo: string; // e.g. "2026-05"
  monto: number;
  estado: EstadoContribucion;
  fecha: string; // ISO UTC
}

/** `subcuentas` collection — fund sub-account balances. */
export interface Subcuenta {
  $id: string;
  nombre: string;
  porcentajeAsignado: number;
  saldo: number;
  totalAcumulado: number;
}

/** `notificaciones` collection — member notifications. */
export interface Notificacion {
  $id: string;
  asociadoId: string;
  tipo: string;
  mensaje: string;
  leida: boolean;
  fecha: string; // ISO UTC
  metadata: Record<string, string> | null;
}

/** `programas` collection — available programs catalog. */
export interface Programa {
  $id: string;
  nombre: string;
  descripcion: string;
  badgeClass: string;
  badgeText: string;
  progress: number;
  progressColor: string;
  progressText: string;
  tipoPrincipal: string;
  subTipo: string;
}

/** `criterios_ponderacion` collection — scoring criteria per auxilio type. */
export interface CriterioPonderacion {
  $id: string;
  auxilioId: string;
  nombreCriterio: string;
  peso: number;
  umbralMinimo: number;
  umbralMaximo: number;
}

// ─── API response envelope ─────────────────────────────

/** Standard API response wrapper used by all FMPI endpoints. */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
