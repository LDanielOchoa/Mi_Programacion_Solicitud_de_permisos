import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { 
  EquipmentRequestSchema,
  EquipmentRequestInput
} from '../schemas/index.js';
import { getCurrentUser } from '../middleware/auth.js';
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

const equipment = new Hono<AppEnv>();

// POST /equipment-request - Crear solicitud de equipo
equipment.post('/equipment-request', getCurrentUser, async (c) => {
  const currentUser = c.get('currentUser') as User;
  const body = await c.req.json();
  const request: EquipmentRequestInput = validateWithZod(EquipmentRequestSchema, body);
  
  // Insertar en la base de datos
  const result = await executeQuery(
    `INSERT INTO permit_post (code, name, tipo_novedad, description, zona, comp_am, comp_pm, turno)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      currentUser.code,
      currentUser.name,
      request.type,
      request.description,
      request.zona,
      request.codeAM,
      request.codePM,
      request.shift
    ],
    { commit: true }
  );
  
  logger.info({ 
    userCode: currentUser.code, 
    requestId: (result as any).insertId 
  }, 'Solicitud de equipo creada');
  
  return c.json({ message: 'Solicitud de equipo creada exitosamente' });
});

export default equipment; 