import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { 
  LoginSchema, 
  UpdatePhoneSchema,
  LoginInput,
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
import { User, LoginResponse, UserResponse } from '../types/index.js';
import logger from '../config/logger.js';
import { validateWithZod } from '../utils/validation.js';

const auth = new Hono();

// POST /auth/login
auth.post('/login', async (c) => {
  const body = await c.req.json();
  const { code, password }: LoginInput = validateWithZod(LoginSchema, body);
  
  // Buscar usuario en la base de datos
  const user = await executeQuery<User>(
    'SELECT * FROM users WHERE code = ?',
    [code],
    { fetchOne: true }
  );
  
  if (!user || !await verifyPassword(password, user.password)) {
    logger.warn({ code }, 'Intento de login fallido: credenciales inválidas');
    throw new HTTPException(400, { message: 'Credenciales inválidas' });
  }
  
  // Crear token de acceso
  const accessToken = await createAccessToken({ sub: user.code });
  
  const response: LoginResponse = {
    access_token: accessToken,
    role: user.role
  };
  
  logger.info({ code: user.code, role: user.role }, 'Login exitoso');
  return c.json(response);
});

// GET /auth/user
auth.get('/user', getCurrentUser, async (c) => {
  const currentUser = c.get('currentUser') as User;
  
  const response = {
    code: currentUser.code,
    name: currentUser.name,
    phone: currentUser.telefone,
    cargo: currentUser.cargo || ''
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

export default auth; 