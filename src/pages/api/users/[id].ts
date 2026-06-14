import type { APIRoute } from 'astro';
import { getAdminUsers } from '../../../lib/appwrite';
import { getDb, databaseId } from '../../../lib/fmpi/db';
import { Query } from 'node-appwrite'; // <<<--- Importación necesaria

// GET - Obtener un usuario por ID
export const GET: APIRoute = async ({ params, locals }) => {
  if (!locals.esAdmin) {
    return new Response(
      JSON.stringify({ success: false, error: 'No autorizado' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID no proporcionado' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const db = getDb();
    const dbId = databaseId();
    
    // ✅ CORREGIDO: Usar Query.equal en lugar de la cadena de texto
    const result = await db.listDocuments(dbId, 'asociados', [
        Query.equal('userId', id)
    ]);
    
    if (result.documents.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Usuario no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const doc = result.documents[0];
    const user = {
      userId: doc.userId,
      nombre: doc.nombre,
      cedula: doc.cedula,
      email: doc.email || '',
      estado: doc.estado,
      estadoContribucion: doc.estadoContribucion,
      esAdmin: doc.esAdmin || false,
      fechaAfiliacion: doc.fechaAfiliacion
    };
    
    return new Response(
      JSON.stringify({ success: true, user }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error en GET /api/users/[id]:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT - Actualizar usuario
export const PUT: APIRoute = async ({ params, request, locals }) => {
  if (!locals.esAdmin) {
    return new Response(
      JSON.stringify({ success: false, error: 'No autorizado' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID no proporcionado' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const { name, cedula, email, isAdmin, estado } = await request.json();
    
    const db = getDb();
    const dbId = databaseId();
    
    // ✅ CORREGIDO: Usar Query.equal
    const result = await db.listDocuments(dbId, 'asociados', [
        Query.equal('userId', id)
    ]);
    
    if (result.documents.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Usuario no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const docId = result.documents[0].$id;
    
    // Actualizar en la colección asociados
    await db.updateDocument(dbId, 'asociados', docId, {
      nombre: name,
      cedula: cedula,
      estado: estado || 'activo',
      esAdmin: isAdmin || false
    });
    
    // Actualizar preferencias en Appwrite
    const users = getAdminUsers();
    await users.updatePrefs(id, { cedula, esAdmin: isAdmin || false });
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error en PUT /api/users/[id]:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE - Eliminar usuario (CORREGIDO)
export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.esAdmin) {
    return new Response(
      JSON.stringify({ success: false, error: 'No autorizado' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID no proporcionado' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const db = getDb();
    const dbId = databaseId();
    const users = getAdminUsers();
    
    // ✅ CORREGIDO: Usar Query.equal
    const result = await db.listDocuments(dbId, 'asociados', [
        Query.equal('userId', id)
    ]);
    
    if (result.documents.length > 0) {
      // Eliminar el documento de asociados
      await db.deleteDocument(dbId, 'asociados', result.documents[0].$id);
    }
    
    // Eliminar el usuario de Appwrite Auth
    await users.delete(id);
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error en DELETE /api/users/[id]:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};