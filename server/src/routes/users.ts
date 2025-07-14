import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { 
  UserSchema,
  UserInput
} from '../schemas/index.js';
import { requireAdmin, getCurrentUser } from '../middleware/auth.js';
import { executeQuery } from '../config/database.js';
import { User } from '../types/index.js';
import logger from '../config/logger.js';
import { validateWithZod } from '../utils/validation.js';

const users = new Hono<{
  Variables: {
    currentUser: User
  }
}>();

// GET /user/lists - Obtener todos los usuarios (solo admin)
users.get('/user/lists', requireAdmin, async (c) => {
  const usersList = await executeQuery<User[]>(
    'SELECT * FROM users', [], { fetchAll: true }
  );
  return c.json(usersList || []);
});

// POST /users - Agregar nuevo usuario (solo admin)
users.post('/users', requireAdmin, async (c) => {
  const adminUser = c.get('currentUser');
  const body = await c.req.json();
  const user: UserInput = validateWithZod(UserSchema, body);
  
  const existingUser = await executeQuery<User>(
    'SELECT code FROM users WHERE code = ?', [user.code], { fetchOne: true }
  );
  if (existingUser) {
    throw new HTTPException(400, { message: 'El usuario ya existe' });
  }
  
  await executeQuery(
    'INSERT INTO users (code, name, telefone, email, password, role, cargo) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [user.code, user.name, user.phone, user.email || '', user.password || '', user.role || 'employee', user.cargo || ''],
    { commit: true }
  );
  
  logger.info({ admin: adminUser.code, newUserCode: user.code }, 'Usuario agregado');
  return c.json({ message: 'Usuario agregado exitosamente' });
});

// PUT /users/{code} - Actualizar usuario (solo admin)
users.put('/users/:code', requireAdmin, async (c) => {
  const adminUser = c.get('currentUser');
  const code = c.req.param('code');
  const body = await c.req.json();
  const user: UserInput = validateWithZod(UserSchema, body);
  
  if (!code) throw new HTTPException(400, { message: 'Código de usuario requerido' });
  
  const existingUser = await executeQuery<User>(
    'SELECT code FROM users WHERE code = ?', [code], { fetchOne: true }
  );
  if (!existingUser) throw new HTTPException(404, { message: 'Usuario no encontrado' });
  
  if (user.password) {
    await executeQuery(
      'UPDATE users SET name = ?, telefone = ?, email = ?, password = ?, role = ?, cargo = ? WHERE code = ?',
      [user.name, user.phone, user.email || '', user.password, user.role || 'employee', user.cargo || '', code], { commit: true }
    );
  } else {
    await executeQuery(
      'UPDATE users SET name = ?, telefone = ?, email = ?, role = ?, cargo = ? WHERE code = ?',
      [user.name, user.phone, user.email || '', user.role || 'employee', user.cargo || '', code], { commit: true }
    );
  }
  
  logger.info({ admin: adminUser.code, updatedUserCode: code }, 'Usuario actualizado');
  return c.json({ message: 'Usuario actualizado exitosamente' });
});

// DELETE /users/{code} - Eliminar usuario (solo admin)
users.delete('/users/:code', requireAdmin, async (c) => {
  const adminUser = c.get('currentUser');
  const code = c.req.param('code');
  if (!code) throw new HTTPException(400, { message: 'Código de usuario requerido' });
  
  const existingUser = await executeQuery<User>(
    'SELECT code FROM users WHERE code = ?', [code], { fetchOne: true }
  );
  if (!existingUser) throw new HTTPException(404, { message: 'Usuario no encontrado' });
  
  await executeQuery('DELETE FROM users WHERE code = ?', [code], { commit: true });
  
  logger.info({ admin: adminUser.code, deletedUserCode: code }, 'Usuario eliminado');
  return c.json({ message: 'Usuario eliminado exitosamente' });
});

export default users; 