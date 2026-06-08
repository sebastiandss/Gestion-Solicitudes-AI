/**
 * scripts/seed-catalogs.ts
 *
 * Complete FMPI database setup — creates database, collections, attributes, and seeds data.
 *
 * Safe to run multiple times:
 * - Creates database if it doesn't exist
 * - Creates collections if they don't exist
 * - Recreates collections if schema doesn't match
 * - Clears existing data before seeding
 *
 * Usage:
 *   npm run seed
 *
 * Requires in .env:
 *   APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID
 */

import { Client, Databases, ID, Permission, Role } from 'node-appwrite';

// ─── Config ─────────────────────────────────────────────

const ENDPOINT = process.env.APPWRITE_ENDPOINT!;
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID!;
const API_KEY = process.env.APPWRITE_API_KEY!;
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;
const DATABASE_NAME = process.env.APPWRITE_DATABASE_NAME || 'FMPI';

if (!ENDPOINT || !PROJECT_ID || !API_KEY || !DATABASE_ID) {
  console.error(
    '❌ Missing required environment variables. Set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, and APPWRITE_DATABASE_ID.',
  );
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const db = new Databases(client);

// ─── Collection definitions ─────────────────────────────

interface CollectionDef {
  id: string;
  name: string;
  attributes: AttributeDef[];
}

interface AttributeDef {
  type: 'string' | 'integer' | 'float' | 'boolean';
  key: string;
  size?: number;
  required: boolean;
  default?: any;
  array?: boolean;
}

const COLLECTIONS: CollectionDef[] = [
  {
    id: 'auxilios',
    name: 'Auxilios',
    attributes: [
      { type: 'string', key: 'codigo', size: 50, required: true },
      { type: 'string', key: 'nombre', size: 200, required: true },
      { type: 'integer', key: 'montoMaximo', required: true },
      { type: 'integer', key: 'tiempoEsperaDias', required: true },
      { type: 'string', key: 'cadenaAprobacion', size: 500, required: true, array: true },
      { type: 'boolean', key: 'requierePonderacion', required: true },
      { type: 'string', key: 'tipoPrincipal', size: 100, required: true },
    ],
  },
  {
    id: 'programas',
    name: 'Programas',
    attributes: [
      { type: 'string', key: 'nombre', size: 200, required: true },
      { type: 'string', key: 'descripcion', size: 1000, required: true },
      { type: 'string', key: 'badgeClass', size: 50, required: true },
      { type: 'string', key: 'badgeText', size: 100, required: true },
      { type: 'integer', key: 'progress', required: true },
      { type: 'string', key: 'progressColor', size: 50, required: true },
      { type: 'string', key: 'progressText', size: 200, required: true },
      { type: 'string', key: 'tipoPrincipal', size: 100, required: true },
      { type: 'string', key: 'subTipo', size: 100, required: true },
    ],
  },
  {
    id: 'subcuentas',
    name: 'Subcuentas',
    attributes: [
      { type: 'string', key: 'nombre', size: 200, required: true },
      { type: 'integer', key: 'porcentajeAsignado', required: true },
      { type: 'integer', key: 'saldo', required: true },
      { type: 'integer', key: 'totalAcumulado', required: true },
    ],
  },
  {
    id: 'criterios_ponderacion',
    name: 'Criterios de Ponderación',
    attributes: [
      { type: 'string', key: 'auxilioId', size: 50, required: true },
      { type: 'string', key: 'nombreCriterio', size: 200, required: true },
      { type: 'float', key: 'peso', required: true },
      { type: 'integer', key: 'umbralMinimo', required: true },
      { type: 'integer', key: 'umbralMaximo', required: true },
    ],
  },
  {
    id: 'asociados',
    name: 'Asociados',
    attributes: [
      { type: 'string', key: 'userId', size: 50, required: true },
      { type: 'string', key: 'cedula', size: 20, required: true },
      { type: 'string', key: 'nombre', size: 200, required: true },
      { type: 'string', key: 'estado', size: 20, required: true },
      { type: 'string', key: 'estadoContribucion', size: 20, required: true },
      { type: 'string', key: 'fechaAfiliacion', size: 50, required: true },
      { type: 'string', key: 'productosFecoomeva', size: 100, required: true, array: true },
    ],
  },
  {
    id: 'beneficiarios',
    name: 'Beneficiarios',
    attributes: [
      { type: 'string', key: 'asociadoId', size: 50, required: true },
      { type: 'string', key: 'nombre', size: 200, required: true },
      { type: 'string', key: 'parentesco', size: 50, required: true },
      { type: 'string', key: 'cedula', size: 20, required: true },
      { type: 'string', key: 'fechaNacimiento', size: 50, required: true },
    ],
  },
  {
    id: 'solicitudes',
    name: 'Solicitudes',
    attributes: [
      { type: 'string', key: 'asociadoId', size: 50, required: true },
      { type: 'string', key: 'auxilioId', size: 50, required: true },
      { type: 'string', key: 'fechaEvento', size: 50, required: true },
      { type: 'string', key: 'fechaRadicacion', size: 50, required: true },
      { type: 'string', key: 'fechaVencimiento180', size: 50, required: true },
      { type: 'string', key: 'descripcion', size: 2000, required: true },
      { type: 'string', key: 'estado', size: 30, required: true },
      { type: 'integer', key: 'montoAprobado', required: false, default: 0 },
      { type: 'string', key: 'instanciaAprobacionActual', size: 100, required: false },
      { type: 'string', key: 'historialAprobacion', size: 50000, required: false },
      { type: 'string', key: 'analisisIARiesgo', size: 5000, required: false },
    ],
  },
  {
    id: 'contribuciones',
    name: 'Contribuciones',
    attributes: [
      { type: 'string', key: 'asociadoId', size: 50, required: true },
      { type: 'string', key: 'periodo', size: 20, required: true },
      { type: 'integer', key: 'monto', required: true },
      { type: 'string', key: 'estado', size: 20, required: true },
      { type: 'string', key: 'fecha', size: 50, required: true },
    ],
  },
  {
    id: 'notificaciones',
    name: 'Notificaciones',
    attributes: [
      { type: 'string', key: 'asociadoId', size: 50, required: true },
      { type: 'string', key: 'tipo', size: 50, required: true },
      { type: 'string', key: 'mensaje', size: 1000, required: true },
      { type: 'boolean', key: 'leida', required: true },
      { type: 'string', key: 'fecha', size: 50, required: true },
      { type: 'string', key: 'metadata', size: 5000, required: false },
    ],
  },
];

// ─── Seed data ──────────────────────────────────────────

interface AuxilioSeed {
  codigo: string;
  nombre: string;
  montoMaximo: number;
  tiempoEsperaDias: number;
  cadenaAprobacion: string[];
  requierePonderacion: boolean;
  tipoPrincipal: string;
}

/** 13 auxilio types per FMPI regulation. Amounts in COP. */
const AUXILIOS: AuxilioSeed[] = [
  {
    codigo: 'MUERTE',
    nombre: 'Auxilio por Fallecimiento del Asociado',
    montoMaximo: 8000000,
    tiempoEsperaDias: 365,
    cadenaAprobacion: ['Comité de Solidaridad', 'Junta Directiva'],
    requierePonderacion: true,
    tipoPrincipal: 'Fallecimiento',
  },
  {
    codigo: 'DISC_PAR',
    nombre: 'Discapacidad Parcial Permanente',
    montoMaximo: 5000000,
    tiempoEsperaDias: 365,
    cadenaAprobacion: ['Comité de Solidaridad', 'Junta Directiva'],
    requierePonderacion: false,
    tipoPrincipal: 'Salud',
  },
  {
    codigo: 'DISC_ABS',
    nombre: 'Discapacidad Absoluta',
    montoMaximo: 10000000,
    tiempoEsperaDias: 365,
    cadenaAprobacion: ['Comité de Solidaridad', 'Junta Directiva'],
    requierePonderacion: true,
    tipoPrincipal: 'Salud',
  },
  {
    codigo: 'COPAGO',
    nombre: 'Copago de Servicios Médicos',
    montoMaximo: 500000,
    tiempoEsperaDias: 90,
    cadenaAprobacion: ['Comité de Solidaridad'],
    requierePonderacion: false,
    tipoPrincipal: 'Salud',
  },
  {
    codigo: 'TRANSP',
    nombre: 'Auxilio de Transporte',
    montoMaximo: 300000,
    tiempoEsperaDias: 30,
    cadenaAprobacion: ['Comité de Solidaridad'],
    requierePonderacion: false,
    tipoPrincipal: 'Transporte',
  },
  {
    codigo: 'CALAM',
    nombre: 'Auxilio por Calamidad Grave',
    montoMaximo: 3000000,
    tiempoEsperaDias: 0,
    cadenaAprobacion: ['Comité de Solidaridad'],
    requierePonderacion: true,
    tipoPrincipal: 'Calamidad',
  },
  {
    codigo: 'HURTO_H',
    nombre: 'Hurto al Hogar',
    montoMaximo: 2000000,
    tiempoEsperaDias: 180,
    cadenaAprobacion: ['Comité de Solidaridad'],
    requierePonderacion: false,
    tipoPrincipal: 'Hurto',
  },
  {
    codigo: 'HURTO_V',
    nombre: 'Hurto de Vehículo',
    montoMaximo: 1500000,
    tiempoEsperaDias: 180,
    cadenaAprobacion: ['Comité de Solidaridad'],
    requierePonderacion: false,
    tipoPrincipal: 'Hurto',
  },
  {
    codigo: 'DESEMP',
    nombre: 'Auxilio por Desempleo Familiar',
    montoMaximo: 2000000,
    tiempoEsperaDias: 365,
    cadenaAprobacion: ['Comité de Solidaridad', 'Junta Directiva'],
    requierePonderacion: true,
    tipoPrincipal: 'Desempleo',
  },
  {
    codigo: 'FUNER',
    nombre: 'Auxilio Funerario Familiar',
    montoMaximo: 2500000,
    tiempoEsperaDias: 0,
    cadenaAprobacion: ['Comité de Solidaridad'],
    requierePonderacion: false,
    tipoPrincipal: 'Fallecimiento',
  },
  {
    codigo: 'MEDIC',
    nombre: 'Auxilio para Medicamentos de Alto Costo',
    montoMaximo: 800000,
    tiempoEsperaDias: 90,
    cadenaAprobacion: ['Comité de Solidaridad'],
    requierePonderacion: false,
    tipoPrincipal: 'Salud',
  },
  {
    codigo: 'MASC',
    nombre: 'Asistencia Funeraria para Mascotas',
    montoMaximo: 200000,
    tiempoEsperaDias: 0,
    cadenaAprobacion: ['Comité de Solidaridad'],
    requierePonderacion: false,
    tipoPrincipal: 'Recreación',
  },
  {
    codigo: 'GAFAS',
    nombre: 'Auxilio para Lentes y Monturas',
    montoMaximo: 400000,
    tiempoEsperaDias: 180,
    cadenaAprobacion: ['Comité de Solidaridad'],
    requierePonderacion: false,
    tipoPrincipal: 'Salud',
  },
];

interface ProgramaSeed {
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

const PROGRAMAS: ProgramaSeed[] = [
  {
    nombre: 'Beca de Excelencia Estudiantil',
    descripcion:
      'Apoyo económico para asociados o sus hijos en programas de educación superior que mantengan un promedio superior a 4.2.',
    badgeClass: 'b-blue',
    badgeText: 'Convocatoria Abierta',
    progress: 75,
    progressColor: 'var(--blue-400)',
    progressText: '75% del presupuesto anual ejecutado',
    tipoPrincipal: 'Educación',
    subTipo: 'Beca de estudios',
  },
  {
    nombre: 'Auxilio Solidario por Calamidad',
    descripcion:
      'Cobertura inmediata ante afectaciones graves por desastres naturales o siniestros en la vivienda principal del asociado.',
    badgeClass: 'b-amber',
    badgeText: 'Fondo de Emergencia',
    progress: 40,
    progressColor: 'var(--amber-400)',
    progressText: 'Fondo con alta disponibilidad',
    tipoPrincipal: 'Calamidad',
    subTipo: 'Desastre natural',
  },
  {
    nombre: 'Kit de Bienvenida Maternidad',
    descripcion:
      'Apoyo para gastos de natalidad y adecuación inicial entregado a los asociados por el nacimiento o adopción de un hijo.',
    badgeClass: 'b-green',
    badgeText: 'Beneficio Permanente',
    progress: 90,
    progressColor: 'var(--green-400)',
    progressText: 'Cierre de convocatorias próximo',
    tipoPrincipal: 'Natalidad',
    subTipo: 'Parto reciente',
  },
];

interface SubcuentaSeed {
  nombre: string;
  porcentajeAsignado: number;
  saldo: number;
  totalAcumulado: number;
}

/** 5 subcuentas with distribution 60/3/5/19/13 = 100% */
const SUBCUENTAS: SubcuentaSeed[] = [
  {
    nombre: 'Fondo General de Auxilios',
    porcentajeAsignado: 60,
    saldo: 50000000,
    totalAcumulado: 120000000,
  },
  {
    nombre: 'Fondo de Educación',
    porcentajeAsignado: 3,
    saldo: 8000000,
    totalAcumulado: 15000000,
  },
  {
    nombre: 'Fondo de Calamidad',
    porcentajeAsignado: 5,
    saldo: 12000000,
    totalAcumulado: 20000000,
  },
  {
    nombre: 'Fondo de Solidaridad',
    porcentajeAsignado: 19,
    saldo: 35000000,
    totalAcumulado: 80000000,
  },
  {
    nombre: 'Fondo de Administración',
    porcentajeAsignado: 13,
    saldo: 25000000,
    totalAcumulado: 50000000,
  },
];

interface CriterioSeed {
  auxilioCodigo: string;
  nombreCriterio: string;
  peso: number;
  umbralMinimo: number;
  umbralMaximo: number;
}

/** Criterios de ponderación linked to auxilio types with requierePonderacion=true. */
const CRITERIOS: CriterioSeed[] = [
  // MUERTE — scoring criteria
  { auxilioCodigo: 'MUERTE', nombreCriterio: 'Antigüedad del asociado (años)', peso: 0.35, umbralMinimo: 0, umbralMaximo: 20 },
  { auxilioCodigo: 'MUERTE', nombreCriterio: 'Número de beneficiarios registrados', peso: 0.25, umbralMinimo: 0, umbralMaximo: 10 },
  { auxilioCodigo: 'MUERTE', nombreCriterio: 'Historial de contribuciones al día', peso: 0.25, umbralMinimo: 0, umbralMaximo: 24 },
  { auxilioCodigo: 'MUERTE', nombreCriterio: 'Solicitudes previas en 2 años', peso: 0.15, umbralMinimo: 0, umbralMaximo: 5 },

  // DISC_ABS — scoring criteria
  { auxilioCodigo: 'DISC_ABS', nombreCriterio: 'Antigüedad del asociado (años)', peso: 0.30, umbralMinimo: 0, umbralMaximo: 20 },
  { auxilioCodigo: 'DISC_ABS', nombreCriterio: 'Grado de discapacidad certificado', peso: 0.30, umbralMinimo: 0, umbralMaximo: 100 },
  { auxilioCodigo: 'DISC_ABS', nombreCriterio: 'Dependientes económicos', peso: 0.20, umbralMinimo: 0, umbralMaximo: 5 },
  { auxilioCodigo: 'DISC_ABS', nombreCriterio: 'Historial de contribuciones al día', peso: 0.20, umbralMinimo: 0, umbralMaximo: 24 },

  // CALAM — scoring criteria
  { auxilioCodigo: 'CALAM', nombreCriterio: 'Gravedad del evento', peso: 0.35, umbralMinimo: 0, umbralMaximo: 10 },
  { auxilioCodigo: 'CALAM', nombreCriterio: 'Vulnerabilidad económica', peso: 0.25, umbralMinimo: 0, umbralMaximo: 5 },
  { auxilioCodigo: 'CALAM', nombreCriterio: 'Daños materiales estimados (SMMLV)', peso: 0.25, umbralMinimo: 0, umbralMaximo: 20 },
  { auxilioCodigo: 'CALAM', nombreCriterio: 'Tiempo desde última calamidad (meses)', peso: 0.15, umbralMinimo: 0, umbralMaximo: 36 },

  // DESEMP — scoring criteria
  { auxilioCodigo: 'DESEMP', nombreCriterio: 'Tiempo de afiliación continua (años)', peso: 0.30, umbralMinimo: 0, umbralMaximo: 15 },
  { auxilioCodigo: 'DESEMP', nombreCriterio: 'Dependientes económicos', peso: 0.25, umbralMinimo: 0, umbralMaximo: 5 },
  { auxilioCodigo: 'DESEMP', nombreCriterio: 'Historial de contribuciones al día', peso: 0.25, umbralMinimo: 0, umbralMaximo: 24 },
  { auxilioCodigo: 'DESEMP', nombreCriterio: 'Solicitudes de desempleo previas', peso: 0.20, umbralMinimo: 0, umbralMaximo: 3 },
];

// ─── Setup functions ────────────────────────────────────

/** Ensure database exists, create if not. */
async function ensureDatabase(): Promise<void> {
  try {
    await db.get(DATABASE_ID);
    console.log(`   ✓ Database "${DATABASE_NAME}" (${DATABASE_ID}) exists\n`);
  } catch (err: any) {
    if (err.code === 404) {
      console.log(`   ℹ️  Database not found, creating "${DATABASE_NAME}" (${DATABASE_ID})...`);
      await db.create(DATABASE_ID, DATABASE_NAME);
      console.log(`   ✅ Database created\n`);
      // Wait for database to be ready
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      throw err;
    }
  }
}

/** Create a single attribute, handling "already exists" gracefully. */
async function createAttribute(colId: string, attr: AttributeDef): Promise<void> {
  try {
    const def = attr.default ?? null;
    const arr = attr.array || false;

    switch (attr.type) {
      case 'string':
        // createStringAttribute(databaseId, collectionId, key, size, required, xdefault, array, encrypt)
        await db.createStringAttribute(DATABASE_ID, colId, attr.key, attr.size || 255, attr.required, def, arr);
        break;
      case 'integer':
        // createIntegerAttribute(databaseId, collectionId, key, required, min, max, xdefault, array)
        await db.createIntegerAttribute(DATABASE_ID, colId, attr.key, attr.required, null, null, def, arr);
        break;
      case 'float':
        // createFloatAttribute(databaseId, collectionId, key, required, min, max, xdefault, array)
        await db.createFloatAttribute(DATABASE_ID, colId, attr.key, attr.required, null, null, def, arr);
        break;
      case 'boolean':
        // createBooleanAttribute(databaseId, collectionId, key, required, xdefault, array)
        await db.createBooleanAttribute(DATABASE_ID, colId, attr.key, attr.required, def, arr);
        break;
    }
  } catch (err: any) {
    // 409 = attribute already exists, ignore
    if (err.code !== 409) {
      throw err;
    }
  }
}

/** Ensure a collection exists with correct schema. */
async function ensureCollection(col: CollectionDef): Promise<void> {
  let needsRecreate = false;

  try {
    const existing = await db.get(DATABASE_ID, col.id);
    const existingKeys = existing.attributes?.map((a: any) => a.key) || [];
    const requiredKeys = col.attributes.map(a => a.key);
    const hasAll = requiredKeys.every(k => existingKeys.includes(k));

    if (hasAll) {
      console.log(`   ✓ ${col.name} (${col.id}) — schema OK`);
      // Update permissions even if collection exists
      await db.update(DATABASE_ID, col.id, col.name, [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ]);
      return;
    }

    console.log(`   ⚠️  ${col.name} (${col.id}) — missing attributes, recreating...`);
    needsRecreate = true;
  } catch (err: any) {
    if (err.code === 404) {
      console.log(`   ℹ️  ${col.name} (${col.id}) — not found, creating...`);
    } else {
      throw err;
    }
  }

  // Delete if needs recreate
  if (needsRecreate) {
    try {
      await db.deleteCollection(DATABASE_ID, col.id);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err: any) {
      if (err.code !== 404) throw err;
    }
  }

  // Create collection
  await db.createCollection(DATABASE_ID, col.id, col.name, [
    Permission.read(Role.any()),
    Permission.create(Role.any()),
    Permission.update(Role.any()),
    Permission.delete(Role.any()),
  ]);
  console.log(`   ✅ ${col.name} (${col.id}) — created`);

  // Create attributes
  for (const attr of col.attributes) {
    await createAttribute(col.id, attr);
  }
  console.log(`   ✅ ${col.attributes.length} attributes created`);
}

/** Ensure all collections exist with correct schema. */
async function ensureCollections(): Promise<void> {
  console.log('📦 Setting up collections...\n');

  for (const col of COLLECTIONS) {
    await ensureCollection(col);
  }

  console.log('\n   ✅ All collections ready\n');
}

// ─── Seed functions ─────────────────────────────────────

/** Delete all documents from a collection. */
async function clearCollection(colId: string): Promise<number> {
  try {
    const { documents } = await db.listDocuments(DATABASE_ID, colId);
    for (const doc of documents) {
      await db.deleteDocument(DATABASE_ID, colId, doc.$id);
    }
    return documents.length;
  } catch {
    return 0;
  }
}

async function seed(): Promise<void> {
  console.log('🌱 FMPI Database Setup & Seed\n');
  console.log(`   Endpoint: ${ENDPOINT}`);
  console.log(`   Project:  ${PROJECT_ID}`);
  console.log(`   Database: ${DATABASE_ID}\n`);

  // Step 1: Ensure database exists
  console.log('🗄️  Step 1: Database setup');
  await ensureDatabase();

  // Step 2: Ensure collections exist with correct schema
  console.log('📋 Step 2: Collection setup');
  await ensureCollections();

  // Step 3: Seed auxilios
  console.log(`💊 Step 3: Seeding ${AUXILIOS.length} auxilio types...`);
  const deletedAux = await clearCollection('auxilios');
  if (deletedAux > 0) console.log(`   Cleared ${deletedAux} existing documents`);

  const auxilioIds: Record<string, string> = {};
  for (const aux of AUXILIOS) {
    const doc = await db.createDocument(DATABASE_ID, 'auxilios', ID.unique(), aux);
    auxilioIds[aux.codigo] = doc.$id;
    console.log(`   ✅ ${aux.codigo} — ${aux.nombre}`);
  }

  // Step 4: Seed programas
  console.log(`\n📦 Step 4: Seeding ${PROGRAMAS.length} programas...`);
  const deletedProg = await clearCollection('programas');
  if (deletedProg > 0) console.log(`   Cleared ${deletedProg} existing documents`);

  for (const prog of PROGRAMAS) {
    await db.createDocument(DATABASE_ID, 'programas', ID.unique(), prog);
    console.log(`   ✅ ${prog.nombre}`);
  }

  // Step 5: Seed subcuentas
  console.log(`\n💰 Step 5: Seeding ${SUBCUENTAS.length} subcuentas...`);
  const deletedSub = await clearCollection('subcuentas');
  if (deletedSub > 0) console.log(`   Cleared ${deletedSub} existing documents`);

  for (const sub of SUBCUENTAS) {
    await db.createDocument(DATABASE_ID, 'subcuentas', ID.unique(), sub);
    console.log(`   ✅ ${sub.nombre} (${sub.porcentajeAsignado}%)`);
  }

  // Step 6: Seed criterios
  console.log(`\n⚖️  Step 6: Seeding ${CRITERIOS.length} criterios de ponderación...`);
  const deletedCrit = await clearCollection('criterios_ponderacion');
  if (deletedCrit > 0) console.log(`   Cleared ${deletedCrit} existing documents`);

  for (const crit of CRITERIOS) {
    const auxilioId = auxilioIds[crit.auxilioCodigo];
    if (!auxilioId) {
      console.warn(`   ⚠️  Skipping criterio for unknown auxilio: ${crit.auxilioCodigo}`);
      continue;
    }
    const { auxilioCodigo, ...criterioData } = crit;
    await db.createDocument(DATABASE_ID, 'criterios_ponderacion', ID.unique(), {
      ...criterioData,
      auxilioId,
    });
    console.log(`   ✅ ${crit.nombreCriterio} → ${crit.auxilioCodigo}`);
  }

  console.log('\n✨ Seed complete!');
  console.log(`   ${AUXILIOS.length} auxilios | ${PROGRAMAS.length} programas | ${SUBCUENTAS.length} subcuentas | ${CRITERIOS.length} criterios\n`);
  console.log('📝 Next steps:');
  console.log('   1. Ensure APPWRITE_DATABASE_ID in .env matches the database ID shown above');
  console.log('   2. Run "npm run dev" to start the application');
  console.log('   3. The app will use the seeded data for auxilios, programas, etc.\n');
}

seed().catch((err) => {
  console.error('\n❌ Seed failed:', err.message);
  if (err.code) console.error('   Error code:', err.code);
  if (err.response) console.error('   Response:', JSON.stringify(err.response, null, 2));
  process.exit(1);
});
