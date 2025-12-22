import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  LoginSchema,
  UpdatePhoneSchema,
  UpdatePhoneInput
} from '../schemas/index.js';
import {
  createAccessToken,
  verifyPassword,
  getCurrentUser,
  refreshUserCache,
  getUserByCode
} from '../middleware/auth.js';
import { executeQuery } from '../config/database.js';
import { getEmployeeFromSE } from '../config/sqlserver.js';
import { User, LoginResponse, UserResponse } from '../types/index.js';
import logger from '../config/logger.js';
import { validateWithZod } from '../utils/validation.js';

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

const auth = new Hono<AppEnv>();

// POST /auth/login
auth.post('/login', async (c) => {
  const body = await c.req.json();
  const { code, password } = validateWithZod(LoginSchema, body);

  // Si el código está vacío, intentar validar con cédula desde SE_w0550
  if (!code || code.trim() === '') {
    logger.info({ cedula: password }, 'Intento de login sin código, validando con cédula en SE_w0550');

    // Buscar empleado en tabla SE_w0550 con filtros específicos
    const employee = await getEmployeeFromSE(password);

    if (!employee) {
      logger.warn({ cedula: password }, 'Empleado no encontrado en SE_w0550 o no pertenece a los centros de costo permitidos');
      throw new HTTPException(400, { message: 'No tienes acceso al sistema. Solo personal de Técnicos de Mantenimiento y Gestión de Mantenimiento pueden acceder.' });
    }

    // Crear token de acceso para empleado de SE_w0550
    const accessToken = await createAccessToken({ sub: employee.cedula });


    const response: LoginResponse = {
      access_token: accessToken,
      role: 'employee' // Asignar rol de empleado por defecto
    };

    return c.json(response);
  }

  // Lógica original para usuarios con código
  const user = await executeQuery<User>(
    'SELECT * FROM users WHERE code = ?',
    [code],
    { fetchOne: true }
  );

  if (!user || !await verifyPassword(password, user.password)) {
    logger.warn({ code }, 'Intento de login fallido: credenciales inválidas');
    throw new HTTPException(400, { message: 'Credenciales inválidas' });
  }

  // Marcar como usuario registrado si no tiene userType definido
  if (!user.userType) {
    user.userType = 'registered';
  }

  // Log de login exitoso para usuario registrado

  // Crear token de acceso
  const accessToken = await createAccessToken({ sub: user.code });

  const response: LoginResponse = {
    access_token: accessToken,
    role: user.role
  };

  return c.json(response);
});

// GET /auth/user
auth.get('/user', getCurrentUser, async (c) => {
  const currentUser = c.get('currentUser') as User;

  // Si el usuario no existe en la tabla users, intentar obtener datos de SE_w0550
  if (!currentUser || !currentUser.name) {
    const userCode = c.get('payload')?.sub;
    if (userCode) {
      const employee = await getEmployeeFromSE(userCode);
      if (employee) {
        const response = {
          code: employee.cedula,
          name: employee.nombre,
          phone: '', // No hay teléfono en SE_w0550
          cargo: employee.cargo || '',
          cedula: employee.cedula,
          userType: 'se_maintenance'
        };
        return c.json(response);
      }
    }
  }

  const response = {
    code: currentUser.code,
    name: currentUser.name,
    phone: currentUser.telefone,
    cargo: currentUser.cargo || '',
    cedula: currentUser.code, // Para usuarios regulares, usar el código como cédula
    userType: currentUser.userType || 'registered' // Incluir tipo de usuario
  };

  return c.json(response);
});

// POST /update-phone
auth.post('/update-phone', getCurrentUser, async (c) => {
  const currentUser = c.get('currentUser') as User;
  const body = await c.req.json();
  const { phone }: UpdatePhoneInput = validateWithZod(UpdatePhoneSchema, body);

  // Actualizar teléfono en la base de datos
  await executeQuery(
    'UPDATE users SET telefone = ? WHERE code = ?',
    [phone, currentUser.code],
    { commit: true }
  );

  // Limpiar caché del usuario
  await refreshUserCache(currentUser.code);

  logger.info({ code: currentUser.code }, 'Número de teléfono actualizado');
  return c.json({ message: 'Número de teléfono actualizado exitosamente' });
});

// GET /user/{code} - Obtener usuario por código
auth.get('/user/:code', async (c) => {
  const code = c.req.param('code');

  if (!code) {
    throw new HTTPException(400, { message: 'Código de usuario requerido' });
  }

  const user = await getUserByCode(code);

  if (!user) {
    throw new HTTPException(404, { message: 'Usuario no encontrado' });
  }

  const response: UserResponse = {
    code: user.code,
    name: user.name,
    phone: user.telefone
  };

  return c.json(response);
});

// GET /users/list - Obtener lista de usuarios empleados
auth.get('/users/list', async (c) => {
  const users = await executeQuery<Array<{ code: string; name: string }>>(
    'SELECT code, name FROM users WHERE role = ? ORDER BY code',
    ['employee'],
    { fetchAll: true }
  );

  return c.json(users || []);
});

// POST /auth/refresh - Renovar token de acceso
auth.post('/refresh', getCurrentUser, async (c) => {
  const currentUser = c.get('currentUser') as User;

  // Crear nuevo token de acceso
  const newAccessToken = await createAccessToken({ sub: currentUser.code });

  logger.info({ code: currentUser.code }, 'Token renovado exitosamente');

  return c.json({
    accessToken: newAccessToken,
    message: 'Token renovado exitosamente'
  });
});

export default auth; 