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

const users = new Hono<AppEnv>();

// GET /list - Obtener lista simple de usuarios (para dropdowns, cualquier usuario autenticado)
users.get('/list', getCurrentUser, async (c) => {
  const usersList = await executeQuery<User[]>(
    'SELECT code, name FROM users ORDER BY name ASC',
    [],
    { fetchAll: true }
  );

  return c.json(usersList || []);
});

// GET /user/lists - Obtener todos los usuarios (solo admin, con paginación y búsqueda)
users.get('/user/lists', getCurrentUser, requireAdmin, async (c) => {
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '8', 10);
  const offset = (page - 1) * limit;
  const searchTerm = c.req.query('search') || '';
  const area = c.req.query('area') || '';

  const queryParams: (string | number)[] = [];
  let whereClauses: string[] = [];

  if (searchTerm) {
    whereClauses.push(`(name LIKE ? OR code LIKE ? OR cargo LIKE ?)`);
    const searchTermLike = `%${searchTerm}%`;
    queryParams.push(searchTermLike, searchTermLike, searchTermLike);
  }

  if (area && area !== 'Todas') {
    whereClauses.push(`cargo = ?`);
    queryParams.push(area);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const totalQuery = `SELECT COUNT(*) as total FROM users ${whereSql}`;
  const usersQuery = `SELECT code, name, telefone, cargo, role, password FROM users ${whereSql} ORDER BY name ASC LIMIT ? OFFSET ?`;

  const [usersList, totalResult] = await Promise.all([
    executeQuery<User[]>(usersQuery, [...queryParams, limit, offset], { fetchAll: true }),
    executeQuery<{ total: number }>(totalQuery, queryParams, { fetchOne: true })
  ]);

  const total = totalResult?.total || 0;

  return c.json({
    data: usersList || [],
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  });
});

// POST /users - Agregar nuevo usuario (solo admin)
users.post('/users', getCurrentUser, requireAdmin, async (c) => {
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
    'INSERT INTO users (code, name, telefone, password, role, cargo) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [user.code, user.name, user.phone, user.password || '', user.role || 'employee', user.cargo || ''],
    { commit: true }
  );

  logger.info({ admin: adminUser.code, newUserCode: user.code }, 'Usuario agregado');
  return c.json({ message: 'Usuario agregado exitosamente' });
});

// PUT /users/{code} - Actualizar usuario (solo admin)
users.put('/users/:code', getCurrentUser, requireAdmin, async (c) => {
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
      'UPDATE users SET name = ?, telefone = ?, password = ?, role = ?, cargo = ? WHERE code = ?',
      [user.name, user.phone, user.password, user.role || 'employee', user.cargo || '', code], { commit: true }
    );
  } else {
    await executeQuery(
      'UPDATE users SET name = ?, telefone = ?, role = ?, cargo = ? WHERE code = ?',
      [user.name, user.phone, user.role || 'employee', user.cargo || '', code], { commit: true }
    );
  }

  logger.info({ admin: adminUser.code, updatedUserCode: code }, 'Usuario actualizado');
  return c.json({ message: 'Usuario actualizado exitosamente' });
});

// DELETE /users/{code} - Eliminar usuario (solo admin)
users.delete('/users/:code', getCurrentUser, requireAdmin, async (c) => {
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