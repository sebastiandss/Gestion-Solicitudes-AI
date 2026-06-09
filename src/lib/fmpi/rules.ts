// src/lib/fmpi/rules.ts
// Pure business rule functions for FMPI regulation compliance.
// All functions are deterministic and side-effect free — fully testable.
// Inputs: data objects. Outputs: RuleResult validation verdicts.
import type {
  Asociado,
  Auxilio,
  Solicitud,
  Subcuenta,
  CriterioPonderacion,
  EstadoSolicitud,
  AccionAprobacion,
} from './types';

// ─── Result types ───────────────────────────────────────

export interface RuleResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ScoringDetail {
  criterio: string;
  raw: number;
  normalized: number;
  weighted: number;
}

export interface ScoringResult {
  score: number;
  details: ScoringDetail[];
}

export type StateAction = AccionAprobacion | 'radicar' | 'cancelar' | 'avanzar' | 'solicitar_documentos' | 'entregar_documentos';

// ─── Internal helpers ───────────────────────────────────

/** Calendar days between two ISO date strings. Negative if b < a. */
function daysBetween(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  return Math.floor((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Compute the 180-day deadline date from the event date. */
export function computeFechaVencimiento180(fechaEvento: string): string {
  const d = new Date(fechaEvento);
  d.setDate(d.getDate() + 180);
  return d.toISOString();
}

// ─── 1. checkEligibility ─────────────────────────────────
// Checks: active status, contributions up-to-date, waiting period

export function checkEligibility(
  asociado: Asociado,
  auxilio: Auxilio,
  fechaEvento: string,
): RuleResult {
  const errors: string[] = [];

  // Member must be active
  if (asociado.estado !== 'activo') {
    errors.push(
      `El asociado no está activo. Estado actual: ${asociado.estado === 'suspendido' ? 'Suspendido' : asociado.estado}.`,
    );
  }

  // Contributions must be current
  if (asociado.estadoContribucion !== 'al_dia') {
    errors.push(
      `El asociado tiene contribuciones en mora. Estado: ${asociado.estadoContribucion === 'moroso' ? 'Moroso' : asociado.estadoContribucion}.`,
    );
  }

  // Waiting period from afiliacion to event date
  const waitDays = auxilio.tiempoEsperaDias;
  if (waitDays > 0) {
    const afiliacionDays = daysBetween(asociado.fechaAfiliacion, fechaEvento);
    if (afiliacionDays < waitDays) {
      errors.push(
        `Período de espera no cumplido. Se requieren ${waitDays} días desde la fecha de afiliación. Transcurridos: ${afiliacionDays} día(s).`,
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── 2. checkDeadline ────────────────────────────────────
// 180 calendar day rule: event must be within 180 days of submission

export function checkDeadline(
  eventDate: string,
  submissionDate: string,
): RuleResult {
  const days = daysBetween(eventDate, submissionDate);
  if (days > 180) {
    return {
      valid: false,
      errors: [
        `Han transcurrido ${days} días desde la fecha del evento. El plazo máximo para radicar es de 180 días calendario.`,
      ],
    };
  }
  return { valid: true, errors: [] };
}

// ─── 3. checkDocumentAge ─────────────────────────────────
// Documents must not be older than 180 days at submission time

export function checkDocumentAge(
  documentDate: string,
  submissionDate: string,
): RuleResult {
  const days = daysBetween(documentDate, submissionDate);
  if (days > 180) {
    return {
      valid: false,
      errors: [
        `El documento tiene ${days} días de antigüedad. La antigüedad máxima permitida es de 180 días.`,
      ],
    };
  }
  return { valid: true, errors: [] };
}

// ─── 4. getApprovalChain ─────────────────────────────────
// Returns the approval chain array from the auxilio catalog

export function getApprovalChain(auxilio: Auxilio): string[] {
  return [...auxilio.cadenaAprobacion];
}

// ─── 5. calculateScoring ─────────────────────────────────
// Weighted scoring using criterios de ponderación.
// Caller provides a map of criterion name → raw value.

export function calculateScoring(
  criterios: CriterioPonderacion[],
  values: Record<string, number>,
): ScoringResult {
  const details: ScoringDetail[] = [];

  const total = criterios.reduce((sum, c) => {
    const raw = values[c.nombreCriterio] ?? 0;
    const range = c.umbralMaximo - c.umbralMinimo;
    const normalized = range > 0 ? clamp((raw - c.umbralMinimo) / range, 0, 1) : 0;
    const weighted = c.peso * normalized;
    details.push({ criterio: c.nombreCriterio, raw, normalized, weighted });
    return sum + weighted;
  }, 0);

  return { score: total, details };
}

// ─── 6. checkFundAvailability ────────────────────────────
// Sub-account must have sufficient funds

export function checkFundAvailability(
  subcuenta: Subcuenta,
  requestedAmount: number,
): RuleResult {
  if (subcuenta.saldo < requestedAmount) {
    return {
      valid: false,
      errors: [
        `Fondos insuficientes en ${subcuenta.nombre}. ` +
        `Disponible: $${subcuenta.saldo.toLocaleString('es-CO')}, ` +
        `Solicitado: $${requestedAmount.toLocaleString('es-CO')}.`,
      ],
    };
  }
  return { valid: true, errors: [] };
}

// ─── 7. checkDuplicateEvent ──────────────────────────────
// Same asociado + same event date cannot be claimed twice

export function checkDuplicateEvent(
  asociadoId: string,
  fechaEvento: string,
  existingSolicitudes: Solicitud[],
  excludeId?: string,
): RuleResult {
  const eventDateKey = new Date(fechaEvento).toISOString().slice(0, 10);

  const duplicates = existingSolicitudes.filter((s) => {
    if (excludeId && s.$id === excludeId) return false;
    return (
      s.asociadoId === asociadoId &&
      s.fechaEvento.slice(0, 10) === eventDateKey
    );
  });

  if (duplicates.length > 0) {
    return {
      valid: false,
      errors: [
        'Ya existe una solicitud registrada para un evento en esta misma fecha. No se permiten solicitudes duplicadas para el mismo evento.',
      ],
    };
  }

  return { valid: true, errors: [] };
}

// ─── 8. getNextState — Solicitud state machine ────────────

const STATE_TRANSITIONS: Record<
  EstadoSolicitud,
  Partial<Record<StateAction, EstadoSolicitud>>
> = {
  radicada: { avanzar: 'en_estudio', cancelar: 'negada' },
  en_estudio: { aprobado: 'en_aprobacion', negado: 'negada', solicitar_documentos: 'pendiente_documentos' },
  en_aprobacion: { aprobado: 'aprobada', negado: 'negada' },
  aprobada: { aprobado: 'en_pago' },
  en_pago: { aprobado: 'pagada' },
  pagada: {},    // terminal
  negada: {},    // terminal
  en_cola_por_fondos: { avanzar: 'en_estudio' },
  pendiente_documentos: {
    entregar_documentos: 'en_estudio',
    aprobado: 'en_aprobacion',
    negado: 'negada',
  },
};


/** Returns the next state given a current state and action, or null if invalid. */
export function getNextState(
  current: EstadoSolicitud,
  action: StateAction,
): EstadoSolicitud | null {
  return STATE_TRANSITIONS[current]?.[action] ?? null;
}

/** Returns the set of valid actions for a given state. */
export function getValidActions(
  current: EstadoSolicitud,
): StateAction[] {
  const transitions = STATE_TRANSITIONS[current];
  if (!transitions) return [];
  return Object.keys(transitions) as StateAction[];
}

// ─── 8b. validateDocumentosRequeridos — guard for document request ──

/**
 * Validates that `documentosRequeridos` is a non-empty array of
 * non-empty strings. Used as a pre-transition guard when an admin
 * requests documents before solicitar_documentos action.
 */
export function validateDocumentosRequeridos(
  documentos: unknown,
): RuleResult {
  if (
    !Array.isArray(documentos) ||
    documentos.length === 0 ||
    !documentos.every((item) => typeof item === 'string' && item.trim().length > 0)
  ) {
    return {
      valid: false,
      errors: [
        'documentosRequeridos debe ser un arreglo no vacío de nombres de documentos.',
      ],
    };
  }
  return { valid: true, errors: [] };
}

// ─── 9. Composite: validateSolicitud ─────────────────────
// Bundles all creation-time validations into one call.
// Used by POST /api/solicitudes.

export interface ValidationInput {
  asociado: Asociado;
  auxilio: Auxilio;
  fechaEvento: string;
  existingSolicitudes: Solicitud[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateSolicitud(input: ValidationInput): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const now = new Date().toISOString();

  // 1. Deadline check: event must be within 180 days
  const deadline = checkDeadline(input.fechaEvento, now);
  errors.push(...deadline.errors);

  // 2. Eligibility: active + al_dia + waiting period
  const eligibility = checkEligibility(input.asociado, input.auxilio, input.fechaEvento);
  errors.push(...eligibility.errors);

  // 3. Duplicate event
  const duplicate = checkDuplicateEvent(
    input.asociado.$id,
    input.fechaEvento,
    input.existingSolicitudes,
  );
  errors.push(...duplicate.errors);

  return { valid: errors.length === 0, errors, warnings };
}

// ─── State display ───────────────────────────────────────

/** Map estado to user-facing Spanish label. */
export function estadoLabel(estado: EstadoSolicitud): string {
  const labels: Record<EstadoSolicitud, string> = {
    radicada: 'Radicada',
    en_estudio: 'En estudio',
    en_aprobacion: 'En aprobación',
    aprobada: 'Aprobada',
    en_pago: 'En pago',
    pagada: 'Pagada',
    negada: 'Negada',
    en_cola_por_fondos: 'En espera por fondos',
    pendiente_documentos: 'Pendiente de documentos',
  };
  return labels[estado] || estado;
}

/** Progress percentage for display bar (0–100). */
export function estadoProgress(estado: EstadoSolicitud): number {
  const progress: Record<EstadoSolicitud, number> = {
    radicada: 10,
    en_estudio: 30,
    en_aprobacion: 50,
    aprobada: 70,
    en_pago: 85,
    pagada: 100,
    negada: 100,
    en_cola_por_fondos: 60,
    pendiente_documentos: 25,
  };
  return progress[estado] ?? 0;
}

/** CSS class suffix for estado badge color. */
export function estadoBadgeClass(estado: EstadoSolicitud): string {
  const classes: Record<EstadoSolicitud, string> = {
    radicada: 'b-blue',
    en_estudio: 'b-amber',
    en_aprobacion: 'b-amber',
    aprobada: 'b-green',
    en_pago: 'b-green',
    pagada: 'b-green',
    negada: 'b-red',
    en_cola_por_fondos: 'b-amber',
    pendiente_documentos: 'b-amber',
  };
  return classes[estado] || 'b-gray';
}
