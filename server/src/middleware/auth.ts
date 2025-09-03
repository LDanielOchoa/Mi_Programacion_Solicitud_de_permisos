import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import jwt, { SignOptions } from 'jsonwebtoken';
import { executeQuery } from '../config/database.js';
import { getEmployeeFromSE } from '../config/sqlserver.js';
import { User, JWTPayload } from '../types/index.js';
import logger from '../config/logger.js';
import { cache } from '../lib/cache-manager.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_jwt_muy_segura_aqui';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h'; // Cambiado de 30m a 2h

// Función para crear token JWT
export const createAccessToken = async (data: { sub: string }, expiresIn?: string): Promise<string> => {
  const payload = {
    sub: data.sub,
    iat: Math.floor(Date.now() / 1000),
  };
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: expiresIn || JWT_EXPIRES_IN 
  } as SignOptions);
};

// Función para verificar contraseña
export const verifyPassword = async (plainPassword: string, storedPassword: string): Promise<boolean> => {
  if (!plainPassword || !storedPassword) {
    return false;
  }
  // Comparación directa de contraseñas en texto plano
  return plainPassword === storedPassword;
};

// Función para obtener usuario actual (con caché)
export const getCurrentUser = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  logger.debug({ authHeader }, 'Header de autorización recibido');
    
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Token de autorización faltante o mal formado');
    throw new HTTPException(401, { message: 'Token de autorización requerido' });
  }
  
  const token = authHeader.substring(7);
  logger.debug({ token: token.substring(0, 10) + '...' }, 'Token JWT extraído'); // Log solo una parte del token por seguridad

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    logger.debug({ payload }, 'Token JWT verificado exitosamente');
    
    // Verificar si el token ha expirado
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      logger.warn({ sub: payload.sub }, 'Token expirado');
      throw new HTTPException(401, { message: 'Token expirado' });
    }
    
    // Deshabilitar cache completamente para evitar mezcla de contextos
    // Siempre consultar directamente la base de datos
    logger.debug({ sub: payload.sub }, 'Consultando usuario directamente desde DB (sin cache)');
    let user = await executeQuery<User>(
      'SELECT * FROM users WHERE code = ?',
      [payload.sub],
      { fetchOne: true }
    );
    
    // Si no se encuentra en users, buscar en SE_w0550
    if (!user) {
      logger.debug({ sub: payload.sub }, 'Usuario no encontrado en tabla users, buscando en SE_w0550');
      const employee = await getEmployeeFromSE(payload.sub);
      if (employee) {
        // Crear objeto User compatible desde datos de SE_w0550
        user = {
          code: employee.cedula,
          name: employee.nombre,
          telefone: '', 
          cargo: employee.cargo,
          role: 'employee', 
          password: '', 
          email: employee.email || '',
          userType: 'se_maintenance' // Marcar como usuario de SE_w0550
        } as User;
        logger.info({ 
          cedula: employee.cedula, 
          nombre: employee.nombre, 
          userType: 'se_maintenance',
          centroCosto: employee.centroCosto 
        }, 'Usuario de mantenimiento encontrado en SE_w0550');
      }
    }
    
    if (user) {
      logger.debug({ userCode: user.code, role: user.role }, 'Usuario encontrado y validado');
    }
    
    if (!user) {
      logger.warn({ sub: payload.sub }, 'Usuario no encontrado en ninguna tabla');
      throw new HTTPException(401, { message: 'Usuario no encontrado' });
    }
    
    // Agregar usuario al contexto
    c.set('currentUser', user);
    logger.debug({ userCode: user.code, role: user.role }, 'Usuario actual establecido en el contexto');
    
    await next();
    
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.error({ err: error, token: token.substring(0, 10) + '...' }, 'Token JWT inválido');
      throw new HTTPException(401, { message: 'Token inválido' });
    }
    if (error instanceof HTTPException) {
      throw error;
    }
    logger.error({ err: error, token: token.substring(0, 10) + '...' }, 'Error inesperado en middleware de autenticación');
    throw new HTTPException(500, { message: 'Error interno del servidor' });
  }
};

// Middleware para verificar rol de administrador
export const requireAdmin = async (c: Context, next: Next) => {
  const user = c.get('currentUser') as User;
  
  if (!user) {
    // Esto no debería pasar si getCurrentUser se ejecuta primero, pero es una buena práctica.
    throw new HTTPException(401, { message: 'Autenticación requerida' });
  }
  
  if (user.role !== 'admin') {
    logger.warn({ userCode: user.code, role: user.role, path: c.req.url }, 'Intento de acceso de administrador no autorizado');
    throw new HTTPException(403, { message: 'Acceso denegado. Se requieren permisos de administrador.' });
  }
  
  await next();
};

// Función para refrescar caché de usuario
export const refreshUserCache = async (userCode: string): Promise<void> => {
  // Como no tenemos un método de invalidación por patrón en el cache simple,
  // limpiamos todo el cache para asegurar consistencia
  cache.flush();
  logger.info({ userCode }, 'Caché de usuario invalidado completamente');
};

// Función para obtener usuario por código (sin caché para evitar mezcla de contextos)
export const getUserByCode = async (code: string): Promise<User | null> => {
  try {
    const user = await executeQuery<User>(
      'SELECT * FROM users WHERE code = ?',
      [code],
      { fetchOne: true }
    );
    logger.debug({ userCode: code, found: !!user }, 'Usuario consultado directamente desde DB');
    return user || null;
  } catch (error) {
    logger.error({ err: error, code }, 'Error al obtener usuario por código');
    return null;
  }
}; 