import type { APIRoute } from 'astro';
import { getAdminUsers } from '../../../lib/appwrite';
import { getDb, databaseId } from '../../../lib/fmpi/db';
import { ID } from 'node-appwrite';

// GET - Listar usuarios con paginación
export const GET: APIRoute = async ({ locals, url }) => {
  if (!locals.esAdmin) {
    return new Response(
      JSON.stringify({ success: false, error: 'No autorizado' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    
    const db = getDb();
    const dbId = databaseId();
    const users = getAdminUsers();
    
    // Obtener todos los asociados
    const result = await db.listDocuments(dbId, 'asociados');
    const allUsers = result.documents;
    const total = allUsers.length;
    const paginatedUsers = allUsers.slice(offset, offset + limit);
    
    // Para cada usuario, obtener el email desde Auth
    const usersWithEmail = [];
    for (const doc of paginatedUsers) {
      try {
        const authUser = await users.get(doc.userId);
        usersWithEmail.push({
          userId: doc.userId,
          nombre: doc.nombre,
          cedula: doc.cedula,
          email: authUser.email,
          estado: doc.estado,
          estadoContribucion: doc.estadoContribucion,
          esAdmin: doc.esAdmin || false,
          fechaAfiliacion: doc.fechaAfiliacion
        });
      } catch (error) {
        console.error(`Error obteniendo email para ${doc.userId}:`, error);
        usersWithEmail.push({
          userId: doc.userId,
          nombre: doc.nombre,
          cedula: doc.cedula,
          email: 'Error al cargar',
          estado: doc.estado,
          estadoContribucion: doc.estadoContribucion,
          esAdmin: doc.esAdmin || false,
          fechaAfiliacion: doc.fechaAfiliacion
        });
      }
    }
    
    const totalPages = Math.ceil(total / limit);
    
    return new Response(
      JSON.stringify({
        success: true,
        users: usersWithEmail,
        total,
        totalPages,
        currentPage: page
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error en GET /api/users:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST - Crear nuevo usuario
export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.esAdmin) {
    return new Response(
      JSON.stringify({ success: false, error: 'No autorizado' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { name, cedula, email, password, isAdmin, estado } = await request.json();
    
    console.log('Creando usuario:', { name, cedula, email, isAdmin, estado });
    
    if (!name || !cedula || !email || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Todos los campos son obligatorios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const users = getAdminUsers();
    const db = getDb();
    const dbId = databaseId();
    
    // 1. Crear usuario en Auth
    const newUser = await users.create({
      userId: ID.unique(),
      email: email,
      password: password,
      name: name,
    });
    
    console.log('Usuario creado en Auth:', newUser.$id);
    
    // 2. Guardar preferencias
    await users.updatePrefs(newUser.$id, { cedula, esAdmin: isAdmin || false });
    
    // 3. Crear documento en asociados (sin email)
    await db.createDocument(dbId, 'asociados', 'unique()', {
      userId: newUser.$id,
      nombre: name,
      cedula: cedula,
      estado: estado || 'activo',
      estadoContribucion: 'al_dia',
      fechaAfiliacion: new Date().toISOString(),
      productosFecoomeva: [],
      esAdmin: isAdmin || false
    });
    
    console.log('Asociado creado correctamente');
    
    return new Response(
      JSON.stringify({ success: true, userId: newUser.$id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error en POST /api/users:', error);
    
    let errorMessage = error.message;
    if (error?.type === 'user_already_exists') {
      errorMessage = 'Ya existe un usuario con este correo electrónico';
    }
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};