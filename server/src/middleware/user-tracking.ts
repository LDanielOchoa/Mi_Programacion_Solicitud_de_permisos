import { Context, Next } from 'hono';
import { User } from '../types/index.js';
import logger from '../config/logger.js';
import { executeQuery } from '../config/database.js';

// Middleware para trackear actividades por tipo de usuario y guardarlas en la BD
export const trackUserActivity = async (c: Context, next: Next) => {
  // Esperar a que la ruta principal se procese para tener el estado final
  await next();

  const user = c.get('currentUser') as User;
  
  if (user) {
    const method = c.req.method;
    const path = c.req.path;
    const userAgent = c.req.header('User-Agent') || 'Unknown';
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'Unknown';
    const userType = user.userType || 'registered';
    const action = `${method} ${path}`;

    // No bloquear la respuesta al cliente, ejecutar en segundo plano
    (async () => {
      try {
        const query = `
          INSERT INTO user_activity_logs (userCode, userName, userType, role, method, path, ip, userAgent, action)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
          user.code,
          user.name,
          userType,
          user.role,
          method,
          path,
          ip,
          userAgent.substring(0, 255), // Ajustar a la longitud de la columna
          action
        ];
        await executeQuery(query, params);
      } catch (dbError) {
        logger.error({ 
          err: dbError, 
          userCode: user.code 
        }, 'Error al guardar el log de actividad del usuario en la base de datos');
      }
    })();
  }
};
