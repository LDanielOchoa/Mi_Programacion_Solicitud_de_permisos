import { Hono } from 'hono';
import { getCurrentUser } from '../middleware/auth.js';
import { trackUserActivity } from '../middleware/user-tracking.js';
import { executeQuery } from '../config/database.js';
import { User } from '../types/index.js';
import logger from '../config/logger.js';

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

const statistics = new Hono<AppEnv>();

// Middleware para tracking de actividad. Se aplica a todas las rutas de estadísticas.
statistics.use('*', getCurrentUser, trackUserActivity);

// Función auxiliar para obtener conteos de actividad
const getActivityCounts = async (userType: string) => {
  const query = (interval: string) => `
    SELECT COUNT(DISTINCT userCode) as count 
    FROM user_activity_logs 
    WHERE userType = ? AND timestamp >= DATE_SUB(NOW(), INTERVAL ${interval})
  `;
  
  const [today, week, month] = await Promise.all([
    executeQuery<{ count: number }>(query('1 DAY'), [userType], { fetchOne: true }),
    executeQuery<{ count: number }>(query('7 DAY'), [userType], { fetchOne: true }),
    executeQuery<{ count: number }>(query('30 DAY'), [userType], { fetchOne: true })
  ]);

  return {
    activeToday: today?.count || 0,
    activeThisWeek: week?.count || 0,
    activeThisMonth: month?.count || 0,
  };
};

// GET /statistics/user-types - Estadísticas de actividad por tipo de usuario
statistics.get('/user-types', async (c) => {
  try {
    const [registeredActivity, seMaintenanceActivity, totalUsers] = await Promise.all([
      getActivityCounts('registered'),
      getActivityCounts('se_maintenance'),
      executeQuery<{ count: number }>('SELECT COUNT(*) as count FROM users', [], { fetchOne: true })
    ]);

    const response = {
      userTypes: {
        registered: 'Usuarios Registrados',
        se_maintenance: 'Personal de Mantenimiento (SE_w0550)'
      },
      statistics: {
        registered: {
          total: totalUsers?.count || 0,
          ...registeredActivity
        },
        se_maintenance: seMaintenanceActivity
      },
      lastUpdated: new Date().toISOString()
    };

    return c.json(response);
  } catch (error) {
    logger.error({ error }, 'Error obteniendo estadísticas de tipos de usuario');
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

// GET /statistics/login-methods - Estadísticas de métodos de login
statistics.get('/login-methods', async (c) => {
  try {
    const query = `
      SELECT userType, COUNT(*) as count
      FROM user_activity_logs
      WHERE path = '/auth/login' AND method = 'POST'
      GROUP BY userType
    `;
    const results = await executeQuery<{ userType: string, count: number }>(query, []);

    let codePasswordCount = 0;
    let cedulaOnlyCount = 0;

    results.forEach((row: { userType: string; count: number }) => {
      if (row.userType === 'registered') {
        codePasswordCount = row.count;
      } else if (row.userType === 'se_maintenance') {
        cedulaOnlyCount = row.count;
      }
    });

    const totalLogins = codePasswordCount + cedulaOnlyCount;

    const response = {
      loginMethods: {
        code_password: {
          name: 'Código + Contraseña',
          count: codePasswordCount,
          percentage: totalLogins > 0 ? (codePasswordCount / totalLogins) * 100 : 0
        },
        cedula_only: {
          name: 'Solo Cédula (Personal Mantenimiento)',
          count: cedulaOnlyCount,
          percentage: totalLogins > 0 ? (cedulaOnlyCount / totalLogins) * 100 : 0
        }
      },
      lastUpdated: new Date().toISOString()
    };

    return c.json(response);
  } catch (error) {
    logger.error({ error }, 'Error obteniendo estadísticas de métodos de login');
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});

export default statistics;
