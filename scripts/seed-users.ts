/**
 * scripts/seed-users.ts
 *
 * Creates test users in Appwrite Auth and their associated profiles in the FMPI database.
 *
 * Usage:
 *   npm run seed:users
 *
 * Requires in .env:
 *   APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID
 */

import { Client, Databases, ID, Users, Query } from 'node-appwrite';

// ─── Config ─────────────────────────────────────────────

const ENDPOINT = process.env.APPWRITE_ENDPOINT!;
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID!;
const API_KEY = process.env.APPWRITE_API_KEY!;
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;

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
const users = new Users(client);

// ─── Test data ──────────────────────────────────────────

interface TestUser {
  email: string;
  password: string;
  name: string;
  cedula: string;
  estado: 'activo' | 'suspendido';
  estadoContribucion: 'al_dia' | 'moroso';
  fechaAfiliacion: string;
  productosFecoomeva: string[];
  beneficiarios?: Array<{
    nombre: string;
    parentesco: string;
    cedula: string;
    fechaNacimiento: string;
  }>;
}

const TEST_USERS: TestUser[] = [
  {
    email: 'camilo@example.com',
    password: 'Test123!',
    name: 'Camilo Sanchez',
    cedula: '1032456789',
    estado: 'activo',
    estadoContribucion: 'al_dia',
    fechaAfiliacion: '2023-01-15T00:00:00.000Z',
    productosFecoomeva: ['colocacion', 'captacion'],
    beneficiarios: [
      {
        nombre: 'Maria Sanchez',
        parentesco: 'Hija',
        cedula: '1098765432',
        fechaNacimiento: '2010-05-20T00:00:00.000Z',
      },
      {
        nombre: 'Ana Sanchez',
        parentesco: 'Cónyuge',
        cedula: '52345678',
        fechaNacimiento: '1985-08-15T00:00:00.000Z',
      },
    ],
  },
  {
    email: 'maria@example.com',
    password: 'Test123!',
    name: 'Maria Gonzalez',
    cedula: '52345678',
    estado: 'activo',
    estadoContribucion: 'al_dia',
    fechaAfiliacion: '2022-06-10T00:00:00.000Z',
    productosFecoomeva: ['colocacion'],
    beneficiarios: [
      {
        nombre: 'Carlos Gonzalez',
        parentesco: 'Hijo',
        cedula: '1087654321',
        fechaNacimiento: '2012-03-10T00:00:00.000Z',
      },
    ],
  },
  {
    email: 'pedro@example.com',
    password: 'Test123!',
    name: 'Pedro Rodriguez',
    cedula: '80123456',
    estado: 'activo',
    estadoContribucion: 'moroso',
    fechaAfiliacion: '2024-02-20T00:00:00.000Z',
    productosFecoomeva: [],
    beneficiarios: [],
  },
  {
    email: 'luisa@example.com',
    password: 'Test123!',
    name: 'Luisa Fernandez',
    cedula: '53456789',
    estado: 'suspendido',
    estadoContribucion: 'moroso',
    fechaAfiliacion: '2021-11-05T00:00:00.000Z',
    productosFecoomeva: ['captacion'],
    beneficiarios: [],
  },
];

// ─── Seed functions ─────────────────────────────────────

async function createTestUser(userData: TestUser): Promise<string> {
  try {
    // Check if user already exists by email
    const existingUsers = await users.list([
      Query.equal('email', userData.email),
    ]);
    
    if (existingUsers.total > 0) {
      console.log(`   ⚠️  User ${userData.email} already exists, skipping...`);
      return existingUsers.users[0].$id;
    }

    // Create user in Appwrite Auth
    const user = await users.create(
      ID.unique(),
      userData.email,
      null, // phone
      userData.password,
      userData.name,
    );
    
    console.log(`   ✅ Auth user created: ${userData.email} (ID: ${user.$id})`);
    return user.$id;
  } catch (err: any) {
    console.error(`   ❌ Failed to create user ${userData.email}: ${err.message}`);
    throw err;
  }
}

async function createAsociadoProfile(userId: string, userData: TestUser): Promise<string> {
  try {
    // Check if asociado already exists for this userId
    const existing = await db.listDocuments(DATABASE_ID, 'asociados', [
      Query.equal('userId', userId),
    ]);
    
    if (existing.documents.length > 0) {
      console.log(`   ⚠️  Asociado profile for ${userData.email} already exists, skipping...`);
      return existing.documents[0].$id;
    }

    // Create asociado profile
    const asociado = await db.createDocument(DATABASE_ID, 'asociados', ID.unique(), {
      userId,
      cedula: userData.cedula,
      nombre: userData.name,
      estado: userData.estado,
      estadoContribucion: userData.estadoContribucion,
      fechaAfiliacion: userData.fechaAfiliacion,
      productosFecoomeva: userData.productosFecoomeva,
    });
    
    console.log(`   ✅ Asociado profile created: ${userData.name} (ID: ${asociado.$id})`);
    return asociado.$id;
  } catch (err: any) {
    console.error(`   ❌ Failed to create asociado for ${userData.email}: ${err.message}`);
    throw err;
  }
}

async function createBeneficiarios(asociadoId: string, userData: TestUser): Promise<void> {
  if (!userData.beneficiarios || userData.beneficiarios.length === 0) {
    return;
  }

  for (const ben of userData.beneficiarios) {
    try {
      await db.createDocument(DATABASE_ID, 'beneficiarios', ID.unique(), {
        asociadoId,
        nombre: ben.nombre,
        parentesco: ben.parentesco,
        cedula: ben.cedula,
        fechaNacimiento: ben.fechaNacimiento,
      });
      console.log(`   ✅ Beneficiario created: ${ben.nombre} (${ben.parentesco})`);
    } catch (err: any) {
      console.error(`   ❌ Failed to create beneficiario ${ben.nombre}: ${err.message}`);
    }
  }
}

async function seed(): Promise<void> {
  console.log('👥 Creating test users and asociados...\n');
  console.log(`   Endpoint: ${ENDPOINT}`);
  console.log(`   Project:  ${PROJECT_ID}`);
  console.log(`   Database: ${DATABASE_ID}\n`);

  const credentials: Array<{ email: string; password: string; name: string }> = [];

  for (const userData of TEST_USERS) {
    console.log(`\n📝 Processing ${userData.email}...`);
    
    // Create auth user
    const userId = await createTestUser(userData);
    
    // Create asociado profile
    const asociadoId = await createAsociadoProfile(userId, userData);
    
    // Create beneficiarios
    await createBeneficiarios(asociadoId, userData);
    
    credentials.push({
      email: userData.email,
      password: userData.password,
      name: userData.name,
    });
  }

  console.log('\n\n✨ Test users created successfully!\n');
  console.log('📋 Login credentials:');
  console.log('─'.repeat(60));
  for (const cred of credentials) {
    console.log(`   Email:    ${cred.email}`);
    console.log(`   Password: ${cred.password}`);
    console.log(`   Name:     ${cred.name}`);
    console.log('─'.repeat(60));
  }
  console.log('\n💡 Use these credentials to login at http://localhost:4321/login\n');
}

seed().catch((err) => {
  console.error('\n❌ Seed failed:', err.message);
  if (err.code) console.error('   Error code:', err.code);
  if (err.response) console.error('   Response:', JSON.stringify(err.response, null, 2));
  process.exit(1);
});
