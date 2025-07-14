import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  PermitRequest2Schema,
  DateCheckSchema,
  PermitRequest2Input,
  DateCheckInput
} from '../schemas/index.js';
import { getCurrentUser } from '../middleware/auth.js';
import { executeQuery } from '../config/database.js';
import { User, FileUpload } from '../types/index.js';
import logger from '../config/logger.js';
import { validateWithZod } from '../utils/validation.js';

const permits = new Hono();

// Configuración de archivos
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10); // 10MB
const ALLOWED_FILE_TYPES = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,application/pdf').split(',');

// Asegurar que el directorio de uploads existe
await fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(() => {});

// POST /permit-request - Crear solicitud de permiso con archivos
permits.post('/permit-request', getCurrentUser, async (c) => {
  const currentUser = c.get('currentUser') as User;
  const formData = await c.req.formData();
  
  // Extraer datos del formulario
  const code = formData.get('code') as string;
  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const dates = formData.get('dates') as string;
  const noveltyType = formData.get('noveltyType') as string;
  const time = formData.get('time') as string || '';
  const description = formData.get('description') as string;
  const files = formData.getAll('files') as File[];
  
  // Validar datos requeridos
  if (!code || !name || !dates || !noveltyType || !description) {
    throw new HTTPException(400, { message: 'Faltan campos requeridos' });
  }
  
  // Parsear fechas
  let datesList: string[];
  try {
    datesList = JSON.parse(dates);
  } catch (error) {
    throw new HTTPException(400, { message: 'Formato de fechas inválido' });
  }
  
  const savedFiles: FileUpload[] = [];
  
  // Procesar archivos si existen
  if (files && files.length > 0) {
    for (const file of files) {
      if (!file || !file.name) continue;
      
      // Validar tipo de archivo
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        throw new HTTPException(400, { 
          message: `Tipo de archivo no permitido: ${file.type}` 
        });
      }
      
      // Validar tamaño
      if (file.size > MAX_FILE_SIZE) {
        throw new HTTPException(400, { 
          message: `Archivo demasiado grande: ${file.name}` 
        });
      }
      
      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = path.extname(file.name);
      const fileName = `${timestamp}_${randomString}${fileExtension}`;
      const filePath = path.join(UPLOAD_DIR, fileName);
      
      try {
        // Guardar archivo
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await fs.writeFile(filePath, buffer);
        
        savedFiles.push({
          fileName: fileName,
          fileUrl: fileName
        });
        
      } catch (error) {
        // Limpieza en caso de error de escritura
        for (const savedFile of savedFiles) {
          try {
            await fs.unlink(path.join(UPLOAD_DIR, savedFile.fileName));
          } catch (cleanupError) {
            logger.error({ err: cleanupError }, 'Error limpiando archivo tras fallo de escritura');
          }
        }
        throw new HTTPException(500, { message: 'Error al guardar archivo' });
      }
    }
  }
  
  try {
    // Insertar en la base de datos
    const result = await executeQuery(
      `INSERT INTO permit_perms 
       (code, name, telefono, fecha, hora, tipo_novedad, description, files, file_name, file_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        currentUser.code,
        currentUser.name,
        phone,
        datesList.join(','),
        time,
        noveltyType,
        description,
        savedFiles.length > 0 ? JSON.stringify(savedFiles.map(f => f.fileName)) : null,
        savedFiles.length > 0 ? JSON.stringify(savedFiles.map(f => f.fileName)) : null,
        savedFiles.length > 0 ? JSON.stringify(savedFiles.map(f => f.fileName)) : null
      ],
      { commit: true }
    );
    
    logger.info({ 
      userCode: currentUser.code, 
      requestId: (result as any).insertId 
    }, 'Solicitud de permiso con archivos creada');
    
    return c.json({
      message: 'Solicitud de permiso creada exitosamente',
      files: savedFiles
    });
    
  } catch (dbError) {
    // Limpieza en caso de error de BD
    for (const savedFile of savedFiles) {
      try {
        await fs.unlink(path.join(UPLOAD_DIR, savedFile.fileName));
      } catch (cleanupError) {
        logger.error({ err: cleanupError }, 'Error limpiando archivo tras fallo de BD');
      }
    }
    throw dbError; // Re-lanzar para el manejador global
  }
});

// POST /new-permit-request - Crear nueva solicitud de permiso (sin archivos)
permits.post('/new-permit-request', async (c) => {
  const body = await c.req.json();
  const request: PermitRequest2Input = validateWithZod(PermitRequest2Schema, body);
  
  // Insertar en la base de datos
  const result = await executeQuery(
    `INSERT INTO permit_perms 
     (code, name, telefono, fecha, hora, tipo_novedad, description, solicitud, Aprobado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      request.code,
      request.name,
      request.phone,
      request.dates.join(','),
      request.time || '',
      request.noveltyType,
      request.description,
      'approved',
      'pendiente'
    ],
    { commit: true }
  );
  
  logger.info({ 
    userCode: request.code, 
    requestId: (result as any).insertId 
  }, 'Solicitud de permiso sin archivos creada');
  
  return c.json({
    message: 'Solicitud de permiso creada exitosamente',
    id: (result as any).insertId
  });
});

// GET /files/{filename} - Servir archivos
permits.get('/files/:filename', async (c) => {
  const filename = c.req.param('filename');
  
  if (!filename) {
    throw new HTTPException(400, { message: 'Nombre de archivo requerido' });
  }
  
  const filePath = path.join(UPLOAD_DIR, filename);
  
  try {
    await fs.access(filePath);
  } catch (error) {
    throw new HTTPException(404, { message: 'Archivo no encontrado' });
  }
  
  // Leer archivo y enviarlo como stream
  const fileBuffer = await fs.readFile(filePath);
  const mimeType = getMimeType(filename);
  
  return new Response(fileBuffer, {
    headers: {
      'Content-Type': mimeType,
      'Content-Length': fileBuffer.length.toString(),
      'Cache-Control': 'public, max-age=31536000'
    }
  });
});

// POST /check-existing-requests - Verificar solicitudes existentes
permits.post('/check-existing-requests', getCurrentUser, async (c) => {
  const currentUser = c.get('currentUser') as User;
  const body = await c.req.json();
  const { dates }: DateCheckInput = validateWithZod(DateCheckSchema, body);
  
  // Obtener rango de fechas (miércoles a miércoles)
  const today = new Date();
  const lastWednesday = new Date(today);
  lastWednesday.setDate(today.getDate() - ((today.getDay() + 4) % 7));
  
  const nextWednesday = new Date(lastWednesday);
  nextWednesday.setDate(lastWednesday.getDate() + 7);
  
  // Filtrar fechas dentro del rango
  const checkDates = dates.map(date => new Date(date));
  const filteredDates = checkDates.filter(date => 
    date >= lastWednesday && date < nextWednesday
  );
  
  if (filteredDates.length === 0) {
    return c.json({ hasExistingRequest: false });
  }
  
  // Verificar solicitudes existentes
  const dateStrings = filteredDates.map(date => date.toISOString().split('T')[0]);
  const placeholders = dateStrings.map(() => '?').join(',');
  
  const result = await executeQuery<{ count: number }>(
    `SELECT COUNT(*) as count 
     FROM permit_perms 
     WHERE code = ? AND fecha IN (${placeholders}) AND solicitud != 'rejected'`,
    [currentUser.code, ...dateStrings],
    { fetchOne: true }
  );
  
  return c.json({ hasExistingRequest: (result?.count || 0) > 0 });
});

// GET /permit-request/{id} - Obtener solicitud específica
permits.get('/permit-request/:id', async (c) => {
  const id = parseInt(c.req.param('id') || '0', 10);
  
  if (!id) {
    throw new HTTPException(400, { message: 'ID de solicitud requerido' });
  }
  
  const request = await executeQuery(
    'SELECT * FROM permit_perms WHERE id = ?',
    [id],
    { fetchOne: true }
  );
  
  if (!request) {
    throw new HTTPException(404, { message: 'Solicitud no encontrada' });
  }
  
  return c.json(request);
});

// Función auxiliar para obtener tipo MIME
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

export default permits; 