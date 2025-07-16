import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  ApprovalUpdateSchema,
  NotificationStatusUpdateSchema,
  RequestUpdateSchema,
  ApprovalUpdateInput,
  NotificationStatusUpdateInput,
  RequestUpdateInput
} from '../schemas/index.js';
import { getCurrentUser, requireAdmin } from '../middleware/auth.js';
import { executeQuery } from '../config/database.js';
import { User, HistoryRecord } from '../types/index.js';
import logger from '../config/logger.js';
import { validateWithZod } from '../utils/validation.js';

const admin = new Hono<{
  Variables: {
    currentUser: User
  }
}>();

// GET /requests - Obtener todas las solicitudes con paginación (requiere autenticación de admin)
admin.get('/requests', getCurrentUser, requireAdmin, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1', 10);
        let limit = parseInt(c.req.query('limit') || '20', 10);
    const offset = (page - 1) * limit;
    

    logger.info({ page, limit, offset }, 'Obteniendo solicitudes con paginación');

    // Union de ambas tablas para poder ordenar y paginar sobre el conjunto completo
        let unionQuery = `
      (SELECT p.id, p.code, p.name, p.telefono as phone, p.fecha as dates, p.hora as time,
              p.tipo_novedad as type, p.tipo_novedad as noveltyType, p.description,
              p.files, p.time_created as createdAt, p.solicitud as status,
              p.respuesta as reason, p.notifications, 'permiso' as request_type,
              NULL as zona, NULL as codeAM, NULL as codePM, NULL as shift,
              u.password
       FROM permit_perms p
       LEFT JOIN users u ON p.code = u.code)
      UNION ALL
      (SELECT p.id, p.code, p.name, NULL as phone, NULL as dates, NULL as time,
              p.tipo_novedad as type, p.tipo_novedad as noveltyType, p.description,
              NULL as files, p.time_created as createdAt, p.solicitud as status, 
              p.respuesta as reason, p.notifications, 'equipo' as request_type,
              p.zona, p.comp_am as codeAM, p.comp_pm as codePM, p.turno as shift,
              u.password
       FROM permit_post p
       LEFT JOIN users u ON p.code = u.code)
      ORDER BY createdAt DESC
            LIMIT ? OFFSET ?
    `;

    const totalCountQuery = `
      SELECT COUNT(*) as total
      FROM (
        (SELECT id FROM permit_perms)
        UNION ALL
        (SELECT id FROM permit_post)
      ) as total
    `;
    
    logger.debug({ unionQuery, totalCountQuery }, 'Ejecutando consultas SQL');

        const queryParams = limit === -1 ? [] : [limit, offset];

    if (limit === -1) {
      unionQuery = unionQuery.replace('LIMIT ? OFFSET ?', '');
    }

    const [allRequests, totalResult] = await Promise.all([
            executeQuery<any[]>(unionQuery, queryParams, { fetchAll: true }),
      executeQuery<{ total: number }>(totalCountQuery, [], { fetchOne: true })
    ]);

    logger.info({ 
      requestsCount: allRequests?.length || 0, 
      total: totalResult?.total || 0 
    }, 'Solicitudes obtenidas exitosamente');

    const total = totalResult?.total || 0;
    
    // Procesar los datos para asegurar consistencia
    for (const request of allRequests || []) {
      for (const key in request) if (request[key] === null) request[key] = '';
      if (request.dates && typeof request.dates === 'string') {
        request.dates = request.dates.split(',').map((d: string) => d.trim());
      }
      if (request.files && typeof request.files === 'string') {
        request.files = request.files.split(',').map((f: string) => f.trim());
      }
      if (!['pending', 'approved', 'rejected'].includes(request.status)) {
        request.status = 'pending';
      }
    }

    return c.json({
      data: allRequests || [],
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      page: c.req.query('page'),
      limit: c.req.query('limit')
    }, 'Error al obtener solicitudes');
    
    throw new HTTPException(500, { 
      message: 'Error interno del servidor al obtener las solicitudes' 
    });
  }
});

// GET /requests/{code} - Obtener solicitudes por código de usuario
admin.get('/requests/:code', async (c) => {
  const code = c.req.param('code');
  if (!code) throw new HTTPException(400, { message: 'Código de usuario requerido' });

  const permitRequests = await executeQuery<any[]>(
    `SELECT
        p.id,
        p.code,
        p.name,
        p.telefono as phone,
        p.fecha as dates,
        p.hora as time,
        p.tipo_novedad as type,
        p.tipo_novedad as noveltyType,
        p.description,
        p.files,
        p.time_created as createdAt,
        p.solicitud as status,
        p.respuesta as reason,
        p.notifications,
        u.password
      FROM permit_perms p
      LEFT JOIN users u ON p.code = u.code
      WHERE p.code = ? AND p.notifications = '0'`,
    [code], { fetchAll: true }
  );
  const equipmentRequests = await executeQuery<any[]>(
    `SELECT
        p.id,
        p.code,
        p.name,
        p.tipo_novedad as type,
        p.description,
        p.time_created as createdAt,
        p.solicitud as status,
        p.respuesta as reason,
        p.notifications,
        p.zona,
        p.comp_am as codeAM,
        p.comp_pm as codePM,
        p.turno as shift,
        u.password
      FROM permit_post p
      LEFT JOIN users u ON p.code = u.code
      WHERE p.code = ? AND p.notifications = '0'`,
    [code], { fetchAll: true }
  );

  const allRequests = [...(permitRequests || []), ...(equipmentRequests || [])];

  for (const request of allRequests) {
    for (const key in request) if (request[key] === null) request[key] = '';
    if (request.dates && typeof request.dates === 'string') {
      request.dates = request.dates.split(',').map((d: string) => d.trim());
    }
    if (request.files && typeof request.files === 'string') {
      request.files = request.files.split(',').map((f: string) => f.trim());
    }
    if (!['pending', 'approved', 'rejected'].includes(request.status)) {
      request.status = 'pending';
    }
  }
  return c.json(allRequests);
});

// PUT /requests/{id} - Actualizar solicitud
admin.put('/requests/:id', async (c) => {
  const id = parseInt(c.req.param('id') || '0', 10);
  const body = await c.req.json();
  const request: RequestUpdateInput = validateWithZod(RequestUpdateSchema, body);
  if (!id) throw new HTTPException(400, { message: 'ID de solicitud requerido' });

  const result1 = await executeQuery(
    'UPDATE permit_perms SET solicitud = ?, respuesta = ? WHERE id = ?',
    [request.status, request.respuesta || '', id], { commit: true }
  );
  if ((result1 as any).affectedRows === 0) {
    const result2 = await executeQuery(
      'UPDATE permit_post SET solicitud = ?, respuesta = ? WHERE id = ?',
      [request.status, request.respuesta || '', id], { commit: true }
    );
    if ((result2 as any).affectedRows === 0) {
      throw new HTTPException(404, { message: 'Solicitud no encontrada' });
    }
  }
  logger.info({ requestId: id, status: request.status }, 'Solicitud actualizada');
  return c.json({ message: 'Solicitud actualizada exitosamente' });
});

// PUT /requests/{id}/notifications - Actualizar estado de notificación
admin.put('/requests/:id/notifications', async (c) => {
  const id = parseInt(c.req.param('id') || '0', 10);
  const body = await c.req.json();
  const payload: NotificationStatusUpdateInput = validateWithZod(NotificationStatusUpdateSchema, body);
  if (!id) throw new HTTPException(400, { message: 'ID de solicitud requerido' });

  const result1 = await executeQuery(
    'UPDATE permit_perms SET notifications = ? WHERE id = ?',
    [payload.notification_status, id], { commit: true }
  );
  if ((result1 as any).affectedRows === 0) {
    const result2 = await executeQuery(
      'UPDATE permit_post SET notifications = ? WHERE id = ?',
      [payload.notification_status, id], { commit: true }
    );
    if ((result2 as any).affectedRows === 0) {
      throw new HTTPException(404, { message: 'Solicitud no encontrada' });
    }
  }
  logger.info({ requestId: id, notificationStatus: payload.notification_status }, 'Estado de notificación actualizado');
  return c.json({ message: 'Estado de notificación actualizado exitosamente' });
});

// PUT /update-approval/{id} - Actualizar aprobación
admin.put('/update-approval/:id', async (c) => {
  const id = parseInt(c.req.param('id') || '0', 10);
  const body = await c.req.json();
  const approval: ApprovalUpdateInput = validateWithZod(ApprovalUpdateSchema, body);
  if (!id) throw new HTTPException(400, { message: 'ID de solicitud requerido' });

  const result = await executeQuery(
    'UPDATE permit_perms SET Aprobado = ? WHERE id = ?',
    [approval.approved_by, id], { commit: true }
  );
  if ((result as any).affectedRows === 0) {
    throw new HTTPException(404, { message: 'Solicitud no encontrada' });
  }
  logger.info({ requestId: id, approvedBy: approval.approved_by }, 'Aprobación actualizada');
  return c.json({ message: 'Aprobación actualizada exitosamente' });
});

// DELETE /requests/{id} - Eliminar solicitud
admin.delete('/requests/:id', async (c) => {
  const id = parseInt(c.req.param('id') || '0', 10);
  if (!id) throw new HTTPException(400, { message: 'ID de solicitud requerido' });

  const result1 = await executeQuery('DELETE FROM permit_perms WHERE id = ?', [id], { commit: true });
  if ((result1 as any).affectedRows === 0) {
    const result2 = await executeQuery('DELETE FROM permit_post WHERE id = ?', [id], { commit: true });
    if ((result2 as any).affectedRows === 0) {
      throw new HTTPException(404, { message: 'Solicitud no encontrada' });
    }
  }
  logger.info({ requestId: id }, 'Solicitud eliminada');
  return c.json({ message: 'Solicitud eliminada exitosamente' });
});

// GET /solicitudes - Obtener solicitudes del usuario actual
admin.get('/solicitudes', getCurrentUser, async (c) => {
  const currentUser = c.get('currentUser') as User;
  
  const permitRequests = await executeQuery<any[]>(
    `SELECT
        id,
        code,
        name,
        telefono,
        fecha,
        hora,
        tipo_novedad,
        description,
        files,
        time_created as createdAt,
        solicitud as status,
        respuesta,
        notifications,
        file_name,
        file_url,
        '' as zona,
        '' as comp_am,
        '' as comp_pm,
        '' as turno,
        'permiso' as request_type
      FROM permit_perms
      WHERE code = ? AND solicitud IN ('approved', 'rejected', 'pending')`,
    [currentUser.code], { fetchAll: true }
  );
  const equipmentRequests = await executeQuery<any[]>(
    `SELECT
        id,
        code,
        name,
        tipo_novedad,
        description,
        time_created as createdAt,
        solicitud as status,
        respuesta,
        notifications,
        zona,
        comp_am,
        comp_pm,
        turno,
        '' as telefono,
        '' as fecha,
        '' as hora,
        '' as files,
        '' as file_name,
        '' as file_url,
        'solicitud' as request_type
      FROM permit_post
      WHERE code = ? AND solicitud IN ('approved', 'rejected')`,
    [currentUser.code], { fetchAll: true }
  );
  
  const allRequests = [...(permitRequests || []), ...(equipmentRequests || [])];

  for (const request of allRequests) {
    if (request.createdAt instanceof Date) {
      request.createdAt = request.createdAt.toISOString();
    }
    if (request.files && typeof request.files === 'string') {
      try {
        request.files = request.files.split(',').map((f: string) => f.trim());
      } catch {
        request.files = [request.files];
      }
    }
    for (const key in request) if (request[key] === null) request[key] = '';
  }
  return c.json(allRequests);
});

// GET /history/{code} - Obtener historial de usuario
admin.get('/history/:code', async (c) => {
  const code = c.req.param('code');
  if (!code) throw new HTTPException(400, { message: 'Código de usuario requerido' });
  
  const userExists = await executeQuery<{ count: number }>(
    'SELECT COUNT(*) as count FROM users WHERE code = ?', [code], { fetchOne: true }
  );
  if (!userExists || userExists.count === 0) {
    throw new HTTPException(404, { message: `No se encontró un usuario con el código ${code}` });
  }

  const history = await executeQuery<HistoryRecord[]>(
    `SELECT
        id,
        COALESCE(tipo_novedad, 'Sin tipo') AS type,
        COALESCE(time_created, NOW()) AS createdAt,
        COALESCE(fecha, '') AS requestedDates,
        COALESCE(solicitud, 'Pendiente') AS status
      FROM permit_perms
      WHERE code = ?
      ORDER BY time_created DESC
      LIMIT 50`,
    [code], { fetchAll: true }
  );
  
  for (const item of history || []) {
    if (item.createdAt) {
      if (typeof item.createdAt === 'string') {
        try {
          item.createdAt = new Date(item.createdAt).toISOString();
        } catch {
          item.createdAt = new Date().toISOString();
        }
      } else if (item.createdAt instanceof Date) {
        item.createdAt = item.createdAt.toISOString();
      }
    }
  }
  return c.json(history || []);
});

// GET /requests/{id}/history - Obtener historial de una solicitud específica
admin.get('/requests/:id/history', getCurrentUser, requireAdmin, async (c) => {
  try {
    const id = parseInt(c.req.param('id') || '0', 10);
    
    if (!id) {
      throw new HTTPException(400, { message: 'ID de solicitud requerido' });
    }

    logger.info({ requestId: id }, 'Obteniendo historial de solicitud');

    // Buscar en ambas tablas para encontrar la solicitud
    const permitRequest = await executeQuery<any>(
      `SELECT 
        id,
        code,
        name,
        tipo_novedad as type,
        time_created as createdAt,
        solicitud as status,
        fecha as requestedDates,
        respuesta as reason,
        'permiso' as request_type
      FROM permit_perms 
      WHERE id = ?`,
      [id],
      { fetchOne: true }
    );

    const equipmentRequest = await executeQuery<any>(
      `SELECT 
        id,
        code,
        name,
        tipo_novedad as type,
        time_created as createdAt,
        solicitud as status,
        zona as requestedDates,
        respuesta as reason,
        'equipo' as request_type
      FROM permit_post 
      WHERE id = ?`,
      [id],
      { fetchOne: true }
    );

    const request = permitRequest || equipmentRequest;

    if (!request) {
      throw new HTTPException(404, { message: 'Solicitud no encontrada' });
    }

    // Crear historial basado en la solicitud encontrada
    const history = [
      {
        id: `hist_${request.id}_1`,
        type: 'Solicitud creada',
        createdAt: request.createdAt,
        status: 'created',
        description: `Solicitud de ${request.request_type} creada por ${request.name}`
      }
    ];

    // Agregar entrada de cambio de estado si no está pendiente
    if (request.status !== 'pending') {
      history.push({
        id: `hist_${request.id}_2`,
        type: `Solicitud ${request.status === 'approved' ? 'aprobada' : 'rechazada'}`,
        createdAt: request.createdAt, // Usar la misma fecha por ahora
        status: request.status,
        description: request.reason || `Solicitud ${request.status === 'approved' ? 'aprobada' : 'rechazada'}`
      });
    }

    // Agregar entrada de notificación si existe
    if (request.notifications === '1') {
      history.push({
        id: `hist_${request.id}_3`,
        type: 'Notificación enviada',
        createdAt: request.createdAt,
        status: 'notified',
        description: 'Notificación enviada al solicitante'
      });
    }

    logger.info({ 
      requestId: id, 
      historyCount: history.length 
    }, 'Historial de solicitud obtenido exitosamente');

    return c.json({
      history: history,
      request: {
        id: request.id,
        type: request.type,
        status: request.status,
        requestedDates: request.requestedDates,
        createdAt: request.createdAt
      }
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    
    logger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      requestId: c.req.param('id')
    }, 'Error al obtener historial de solicitud');
    
    throw new HTTPException(500, { 
      message: 'Error interno del servidor al obtener el historial' 
    });
  }
});

// GET /requests/user/{code}/history - Obtener historial completo de solicitudes de una persona
admin.get('/requests/user/:code/history', getCurrentUser, requireAdmin, async (c) => {
  try {
    const userCode = c.req.param('code');
    
    if (!userCode) {
      throw new HTTPException(400, { message: 'Código de usuario requerido' });
    }

    logger.info({ userCode }, 'Obteniendo historial completo de usuario');

    // Obtener todas las solicitudes de permisos del usuario
    const permitRequests = await executeQuery<any[]>(
      `SELECT 
        id,
        code,
        name,
        tipo_novedad as type,
        time_created as createdAt,
        solicitud as status,
        fecha as requestedDates,
        respuesta as reason,
        description,
        'permiso' as request_type
      FROM permit_perms 
      WHERE code = ?
      ORDER BY time_created DESC`,
      [userCode],
      { fetchAll: true }
    );

    // Obtener todas las solicitudes de equipos del usuario
    const equipmentRequests = await executeQuery<any[]>(
      `SELECT 
        id,
        code,
        name,
        tipo_novedad as type,
        time_created as createdAt,
        solicitud as status,
        zona as requestedDates,
        respuesta as reason,
        description,
        'equipo' as request_type
      FROM permit_post 
      WHERE code = ?
      ORDER BY time_created DESC`,
      [userCode],
      { fetchAll: true }
    );

    // Combinar y ordenar todas las solicitudes
    const allRequests = [...(permitRequests || []), ...(equipmentRequests || [])]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Crear historial detallado
    const history = allRequests.map((request, index) => {
      const baseHistory = [
        {
          id: `hist_${request.id}_created`,
          type: `Solicitud de ${request.request_type}`,
          createdAt: request.createdAt,
          status: request.status, // Usar el estado real de la base de datos
          description: `${request.type} - ${request.description || 'Sin descripción'}`,
          requestedDates: request.requestedDates,
          requestId: request.id,
          requestType: request.request_type
        }
      ];

      // Agregar entrada de respuesta si no está pendiente
      if (request.status !== 'pending' && request.reason) {
        baseHistory.push({
          id: `hist_${request.id}_${request.status}`,
          type: `Solicitud ${request.status === 'approved' ? 'aprobada' : 'rechazada'}`,
          createdAt: request.createdAt,
          status: request.status,
          description: request.reason,
          requestedDates: request.requestedDates,
          requestId: request.id,
          requestType: request.request_type
        });
      }

      return baseHistory;
    }).flat();

    logger.info({ 
      userCode, 
      totalRequests: allRequests.length,
      historyCount: history.length 
    }, 'Historial completo de usuario obtenido exitosamente');

    return c.json({
      history: history,
      userInfo: {
        code: userCode,
        name: allRequests[0]?.name || 'Usuario',
        totalRequests: allRequests.length,
        totalPermits: permitRequests?.length || 0,
        totalEquipment: equipmentRequests?.length || 0
      },
      requests: allRequests
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    
    logger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userCode: c.req.param('code')
    }, 'Error al obtener historial completo de usuario');
    
    throw new HTTPException(500, { 
      message: 'Error interno del servidor al obtener el historial completo' 
    });
  }
});

// GET /test-db - Ruta de prueba para verificar la base de datos
admin.get('/test-db', async (c) => {
  try {
    // Verificar que las tablas existen
    const tablesQuery = `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('permit_perms', 'permit_post', 'users')
    `;
    
    const tables = await executeQuery<any[]>(
      tablesQuery, 
      [process.env.DB_NAME || 'bdsaocomco_solicitudpermisos'], 
      { fetchAll: true }
    );
    
    logger.info({ tables: tables?.map((t: any) => t.TABLE_NAME) }, 'Tablas encontradas');
    
    // Verificar estructura de las tablas
    const permitPermsStructure = await executeQuery<any[]>(
      'DESCRIBE permit_perms',
      [],
      { fetchAll: true }
    );
    
    const permitPostStructure = await executeQuery<any[]>(
      'DESCRIBE permit_post',
      [],
      { fetchAll: true }
    );
    
    return c.json({
      message: 'Conexión a la base de datos exitosa',
      tables: tables?.map((t: any) => t.TABLE_NAME) || [],
      permitPermsColumns: permitPermsStructure?.map((c: any) => c.Field) || [],
      permitPostColumns: permitPostStructure?.map((c: any) => c.Field) || []
    });
    
  } catch (error) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, 'Error en prueba de base de datos');
    
    throw new HTTPException(500, { 
      message: 'Error al conectar con la base de datos' 
    });
  }
});

export default admin; 