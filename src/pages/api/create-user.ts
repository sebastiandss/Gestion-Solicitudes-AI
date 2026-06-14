import type { APIRoute } from 'astro';
import { getAdminUsers } from '../../lib/appwrite';
import { getDb, databaseId } from '../../lib/fmpi/db';
import { ID } from 'node-appwrite';

export const POST: APIRoute = async ({ request, locals }) => {
  // Solo administradores pueden crear usuarios
  if (!locals.esAdmin) {
    return new Response(
      JSON.stringify({ success: false, error: 'No autorizado. Solo administradores pueden crear usuarios.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { email, password, name, cedula, isAdmin } = await request.json();
    
    // Validaciones básicas
    if (!email || !password || !name || !cedula) {
      return new Response(
        JSON.stringify({ success: false, error: 'Todos los campos son obligatorios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const users = getAdminUsers();
    const db = getDb();
    const dbId = databaseId();
    
    console.log('=== CREANDO USUARIO ===');
    console.log('Email:', email);
    console.log('Name:', name);
    console.log('Database ID:', dbId);
    
    // 1. Crear usuario en Appwrite Auth
    const newUser = await users.create({
      userId: ID.unique(),
      email,
      password,
      name,
    });
    
    console.log('Usuario creado:', newUser.$id);
    
    // 2. Guardar cédula y rol en preferencias
    await users.updatePrefs(newUser.$id, { 
      cedula,
      esAdmin: isAdmin || false 
    });
    
    console.log('Preferencias guardadas');
    
    // 3. Crear el perfil de asociado en la base de datos
    console.log('Intentando crear asociado...');
    try {
      const doc = await db.createDocument(dbId, 'asociados', 'unique()', {
        userId: newUser.$id,
        nombre: name,
        cedula: cedula,
        estado: 'activo',
        estadoContribucion: 'al_dia',
        fechaAfiliacion: new Date().toISOString(),
        productosFecoomeva: [
        ],
        esAdmin: isAdmin || false
      });
      console.log('✅ Asociado creado:', doc.$id);
    } catch (dbError) {
      console.error('❌ Error al crear asociado:', dbError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: newUser.$id,
        message: `Usuario ${name} creado exitosamente` 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    let errorMessage = 'Error al crear el usuario';
    if (error?.type === 'user_already_exists') {
      errorMessage = 'Ya existe una cuenta con este correo electrónico';
    } else if (error?.message?.includes('password')) {
      errorMessage = 'La contraseña no cumple con los requisitos mínimos';
    } else if (error?.message?.includes('asociados')) {
      errorMessage = 'Usuario creado pero error al crear perfil de asociado';
    }
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};