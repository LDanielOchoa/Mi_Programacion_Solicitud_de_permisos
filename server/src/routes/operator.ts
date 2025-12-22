import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { getCurrentUser } from '../middleware/auth.js';
import { getOperatorInfo } from '../config/sqlserver.js';
import { User } from '../types/index.js';
import logger from '../config/logger.js';

// Función para verificar qué extensión de imagen existe
const getPhotoUrl = async (cedula: string): Promise<string> => {
  const baseUrl = 'https://admon.sao6.com.co/web/uploads/empleados/';
  const extensions = ['jpg', 'jpeg', 'png'];
  
  // Probar cada extensión para ver cuál existe
  for (const ext of extensions) {
    try {
      const url = `${baseUrl}${cedula}.${ext}`;
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        logger.info({ cedula, extension: ext, url }, 'Imagen encontrada');
        return url;
      }
    } catch (error) {
      // Continuar con la siguiente extensión
      continue;
    }
  }
  
  // Si no se encuentra ninguna imagen, usar jpg como fallback
  logger.warn({ cedula }, 'No se encontró imagen para el operador, usando jpg como fallback');
  return `${baseUrl}${cedula}.jpg`;
};

type AppEnv = {
  Variables: {
    currentUser: User;
    payload: { 
      sub: string; 
      iat: number;
      exp: number;
    };
  }
}

const operator = new Hono<AppEnv>();

// GET /operator/info - Obtener información del operador actual
operator.get('/info', getCurrentUser, async (c) => {
  try {
    const currentUser = c.get('currentUser') as User;
    
    logger.info({ userCode: currentUser.code }, 'Obteniendo información del operador');
    
    const operatorInfo = await getOperatorInfo(currentUser.code);
    
    if (!operatorInfo) {
      logger.warn({ userCode: currentUser.code }, 'Operador no encontrado en SQL Server');
      return c.json({
        cedula: currentUser.code,
        nombre: currentUser.name,
        cargo: currentUser.cargo || 'No especificado',
        fechaIngreso: 'No disponible',
        id: 'No disponible',
        foto: `https://admon.sao6.com.co/web/uploads/empleados/${currentUser.code}.jpg`
      });
    }
    
    logger.info({ 
      userCode: currentUser.code, 
      cedula: operatorInfo.cedula,
      nombre: operatorInfo.nombre 
    }, 'Información del operador obtenida exitosamente');
    
    return c.json(operatorInfo);
    
  } catch (error) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userCode: c.get('currentUser')?.code 
    }, 'Error al obtener información del operador');
    
    throw new HTTPException(500, { 
      message: 'Error al obtener información del operador' 
    });
  }
});

// GET /operator/info/:code - Obtener información de un operador específico (solo admin)
operator.get('/info/:code', getCurrentUser, async (c) => {
  try {
    const code = c.req.param('code');
    
    if (!code) {
      throw new HTTPException(400, { message: 'Código de operador requerido' });
    }
    
    logger.info({ operatorCode: code }, 'Obteniendo información de operador específico');
    
    const operatorInfo = await getOperatorInfo(code);
    
    logger.info({ 
      operatorCode: code,
      operatorInfo 
    }, 'Información del operador obtenida');
    
    // Siempre devolver una respuesta, incluso si no se encuentra en SQL Server
    return c.json(operatorInfo);
    
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    
    logger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      operatorCode: c.req.param('code')
    }, 'Error al obtener información del operador específico');
    
    // En caso de error, devolver información por defecto
    const code = c.req.param('code');
    const cedulaLimpia = code.trim();
    const fotoUrl = await getPhotoUrl(cedulaLimpia);
    const defaultResponse = {
      cedula: cedulaLimpia,
      nombre: 'Información no disponible',
      cargo: 'No especificado',
      fechaIngreso: 'No disponible',
      id: 'No disponible',
      foto: fotoUrl
    };
    
    logger.info({ defaultResponse }, 'Devolviendo información por defecto');
    
    return c.json(defaultResponse);
  }
});

export default operator; 