import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import logger from '../config/logger.js';

const images = new Hono();

// GET /images/empleado/:cedula - Proxy para imágenes de empleados
images.get('/empleado/:cedula', async (c) => {
  const cedula = c.req.param('cedula');
  
  if (!cedula) {
    throw new HTTPException(400, { message: 'Cédula requerida' });
  }

  const extensions = ['jpg', 'jpeg', 'png'];
  const baseUrl = 'https://admon.sao6.com.co/web/uploads/empleados/';
  
  logger.info({ cedula }, 'Buscando imagen de empleado');
  
  // Probar cada extensión
  for (const ext of extensions) {
    try {
      const imageUrl = `${baseUrl}${cedula}.${ext}`;
      logger.debug({ imageUrl }, 'Intentando cargar imagen');
      
      const response = await fetch(imageUrl);
      
      if (response.ok) {
        logger.info({ cedula, extension: ext, imageUrl }, 'Imagen encontrada');
        
        // Configurar headers de CORS
        c.header('Access-Control-Allow-Origin', '*');
        c.header('Access-Control-Allow-Methods', 'GET');
        c.header('Access-Control-Allow-Headers', 'Content-Type');
        
        // Configurar headers de imagen
        const contentType = response.headers.get('content-type') || `image/${ext}`;
        c.header('Content-Type', contentType);
        c.header('Cache-Control', 'public, max-age=3600'); // Cache por 1 hora
        
        // Retornar la imagen
        const imageBuffer = await response.arrayBuffer();
        return c.body(imageBuffer);
      }
    } catch (error) {
      logger.debug({ 
        cedula, 
        extension: ext, 
        error: error instanceof Error ? error.message : String(error) 
      }, 'Error al cargar imagen con extensión');
      continue;
    }
  }
  
  logger.warn({ cedula }, 'No se encontró imagen para el empleado');
  throw new HTTPException(404, { message: 'Imagen no encontrada' });
});

export default images;
