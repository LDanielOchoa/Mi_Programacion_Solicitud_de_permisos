import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { 
  WeekQuerySchema,
  WeekQueryInput
} from '../schemas/index.js';
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

const excel = new Hono<AppEnv>();

// GET /excel-permisos - Obtener datos para Excel con discriminación de tipos de usuario  
excel.get('/excel-permisos', async (c) => {
  const records = await executeQuery<any[]>(
    `SELECT 
        p.code,
        p.name,
        p.telefono,
        p.fecha,
        p.tipo_novedad AS novedad,
        p.description,
        p.respuesta,
        p.solicitud,
        COALESCE(u.userType, 'registered') as user_type,
        CASE 
          WHEN COALESCE(u.userType, 'registered') = 'se_maintenance' THEN 'Personal de Mantenimiento'
          ELSE 'Usuario Registrado'
        END as tipo_usuario_desc
      FROM permit_perms p
      LEFT JOIN users u ON p.code = u.code`,
    [],
    { fetchAll: true }
  );
  
  logger.debug(`Registros obtenidos para /excel: ${records?.length || 0}`);
  
  // Agrupar por claves compuestas incluyendo tipo de usuario
  const grouped = new Map<string, { fechas: string[], userType: string, tipoUsuarioDesc: string }>();
  
  for (const r of records || []) {
    const key = `${r.code}|${r.name}|${r.telefono}|${r.novedad}|${r.description}|${r.respuesta}`;
    
    // Separar fechas por coma y limpiar espacios
    let fechas: string[] = [];
    try {
      if (r.fecha) {
        fechas = r.fecha.toString().split(',').map((f: string) => f.trim()).filter((f: string) => f);
      }
    } catch (error) {
      logger.error(`Error al procesar fechas para el registro ${JSON.stringify(r)}: ${error}`);
      fechas = [];
    }
    
    if (grouped.has(key)) {
      grouped.get(key)!.fechas.push(...fechas);
    } else {
      grouped.set(key, { 
        fechas: fechas, 
        userType: r.user_type || 'registered',
        tipoUsuarioDesc: r.tipo_usuario_desc || 'Usuario Registrado'
      });
    }
  }
  
  // Construir el resultado final
  const result = [];
  
  for (const [key, data] of grouped) {
    const [code, name, telefono, novedad, description, respuesta] = key.split('|');
    
    try {
      let fechaInicio = '';
      let fechaFin = '';
      
      if (data.fechas.length > 0) {
        const fechasDate = data.fechas
          .map(f => {
            try {
              return new Date(f);
            } catch {
              logger.warn(`Fecha mal formateada ignorada: '${f}' para key ${key}`);
              return null;
            }
          })
          .filter(d => d !== null) as Date[];
        
        if (fechasDate.length > 0) {
          fechaInicio = new Date(Math.min(...fechasDate.map(d => d.getTime()))).toISOString().split('T')[0];
          fechaFin = new Date(Math.max(...fechasDate.map(d => d.getTime()))).toISOString().split('T')[0];
        }
      }
      
      result.push({
        code,
        name,
        telefono,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        novedad,
        description,
        respuesta,
        user_type: data.userType,
        tipo_usuario: data.tipoUsuarioDesc
      });
      
    } catch (error) {
      logger.error(`Error al convertir fechas para key ${key}: ${error}`);
      result.push({
        code,
        name,
        telefono,
        fecha_inicio: '',
        fecha_fin: '',
        novedad,
        description,
        respuesta,
        user_type: data.userType,
        tipo_usuario: data.tipoUsuarioDesc
      });
    }
  }
  
  logger.info(`Registros procesados para respuesta de /excel: ${result.length}`);
  return c.json(result);
});

// GET /excel-novedades - Obtener datos de novedades para Excel
excel.get('/excel-novedades', async (c) => {
  const records = await executeQuery<any[]>(
    `SELECT 
        code,
        name,
        telefono,
        MIN(fecha) as fecha_inicio,
        MAX(fecha) as fecha_fin,
        tipo_novedad as novedad,
        description,
        respuesta
      FROM permit_perms
      GROUP BY code, name, telefono, tipo_novedad, description, respuesta
      ORDER BY MIN(fecha)`,
    [],
    { fetchAll: true }
  );
  
  // Procesar registros
  for (const record of records || []) {
    if (record.fecha_inicio instanceof Date) {
      record.fecha_inicio = record.fecha_inicio.toISOString().split('T')[0];
    }
    if (record.fecha_fin instanceof Date) {
      record.fecha_fin = record.fecha_fin.toISOString().split('T')[0];
    }
    
    // Convertir fechas de string si es necesario
    if (typeof record.fecha_inicio === 'string' && record.fecha_inicio.includes('T')) {
      record.fecha_inicio = record.fecha_inicio.split('T')[0];
    }
    if (typeof record.fecha_fin === 'string' && record.fecha_fin.includes('T')) {
      record.fecha_fin = record.fecha_fin.split('T')[0];
    }
  }
  
  return c.json(records || []);
});

// GET /historical-records - Obtener registros históricos
excel.get('/historical-records', async (c) => {
  const query = c.req.query();
  const { week }: WeekQueryInput = validateWithZod(WeekQuerySchema, query);
  
  const currentDate = new Date();
  let startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  
  let endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  if (week !== undefined) {
    // Si se especifica una semana, calcular sus fechas de inicio y fin
    const year = currentDate.getFullYear();
    const jan1 = new Date(year, 0, 1);
    const daysOffset = (week - 1) * 7;
    
    startOfWeek = new Date(jan1);
    startOfWeek.setDate(jan1.getDate() + daysOffset);
    
    endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
  }
  
  // Obtener registros aprobados de permit_perms
  const permitRecords = await executeQuery<any[]>(
    `SELECT 
        ANY_VALUE(id) as id,
        code,
        name,
        ANY_VALUE(telefono) as telefono,
        'permiso' as tipo,
        tipo_novedad as novedad,
        ANY_VALUE(hora) as hora,
        MIN(fecha) as fecha_inicio,
        MAX(fecha) as fecha_fin,
        ANY_VALUE(description) as description,
        ANY_VALUE(respuesta) as respuesta,
        ANY_VALUE(solicitud) as solicitud,
        'permiso' as request_type
      FROM permit_perms
      WHERE solicitud = 'approved'
        AND tipo_novedad NOT IN ('descanso', 'licencia')
        AND DATE(time_created) BETWEEN ? AND ?
      GROUP BY code, name, tipo_novedad`,
    [startOfWeek.toISOString().split('T')[0], endOfWeek.toISOString().split('T')[0]],
    { fetchAll: true }
  );

  // Obtener registros aprobados de permit_post
  const equipmentRecords = await executeQuery<any[]>(
    `SELECT 
        ANY_VALUE(id) as id,
        code,
        name,
        '' as telefono,
        'equipo' as tipo,
        tipo_novedad as novedad,
        '' as hora,
        MIN(time_created) as fecha_inicio,
        MAX(time_created) as fecha_fin,
        ANY_VALUE(description) as description,
        ANY_VALUE(respuesta) as respuesta,
        ANY_VALUE(solicitud) as solicitud,
        'equipo' as request_type
      FROM permit_post
      WHERE solicitud = 'approved'
        AND DATE(time_created) BETWEEN ? AND ?
      GROUP BY code, name, tipo_novedad`,
    [startOfWeek.toISOString().split('T')[0], endOfWeek.toISOString().split('T')[0]],
    { fetchAll: true }
  );

  // Combinar y procesar todos los registros
  const allRecords = [...(permitRecords || []), ...(equipmentRecords || [])];
  
  // Procesar los datos para formato consistente
  for (const record of allRecords) {
    // Convertir datetime a string para fechas de inicio y fin
    if (record.fecha_inicio instanceof Date) {
      record.fecha_inicio = record.fecha_inicio.toISOString().split('T')[0];
    }
    if (record.fecha_fin instanceof Date) {
      record.fecha_fin = record.fecha_fin.toISOString().split('T')[0];
    }
    
    // Procesar fechas que vienen como string con comas
    if (typeof record.fecha_inicio === 'string' && record.fecha_inicio.includes(',')) {
      const fechas = record.fecha_inicio.split(',').map((f: string) => f.trim());
      record.fecha_inicio = fechas[0] || '';
    }
    
    if (typeof record.fecha_fin === 'string' && record.fecha_fin.includes(',')) {
      const fechas = record.fecha_fin.split(',').map((f: string) => f.trim());
      record.fecha_fin = fechas[fechas.length - 1] || '';
    }
    
    // Asegurar que todos los campos tengan un valor
    for (const key in record) {
      if (record[key] === null) {
        record[key] = '';
      }
    }
  }
  
  return c.json(allRecords);
});

export default excel; 