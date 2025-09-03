import sql from 'mssql';
import logger from './logger.js';

const sqlServerConfig = {
  server: process.env.SQL_SERVER_HOST || '192.168.90.64',
  port: parseInt(process.env.SQL_SERVER_PORT || '1433', 10),
  user: process.env.SQL_SERVER_USER || 'power-bi',
  password: process.env.SQL_SERVER_PASSWORD || 'Z1x2c3v4*',
  database: process.env.SQL_SERVER_DATABASE || 'UNOEE',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 30000,
    connectionTimeout: 30000
  }
};

// Pool de conexiones para SQL Server
let sqlServerPool: sql.ConnectionPool | null = null;

export const getSqlServerConnection = async (): Promise<sql.ConnectionPool> => {
  try {
    if (!sqlServerPool) {
      sqlServerPool = await sql.connect(sqlServerConfig);
      logger.info('🎉 Conexión a SQL Server establecida exitosamente');
    }
    return sqlServerPool;
  } catch (error) {
    logger.error('❌ Error al conectar con SQL Server:', error);
    throw error;
  }
};

// Cache para URLs de fotos
const photoUrlCache = new Map<string, string>();
const photoUrlCacheExpiry = new Map<string, number>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hora

// Función optimizada para generar URL de foto (sin verificación HTTP)
export const getPhotoUrlFast = (cedula: string): string => {
  const baseUrl = 'https://admon.sao6.com.co/web/uploads/empleados/';
  // Retornar la URL más común (jpg) directamente
  return `${baseUrl}${cedula}.jpg`;
};

// Función para verificar qué extensión de imagen existe (mantener para casos específicos)
export const getPhotoUrl = async (cedula: string): Promise<string> => {
  const now = Date.now();
  
  // Verificar cache
  if (photoUrlCache.has(cedula) && photoUrlCacheExpiry.get(cedula)! > now) {
    return photoUrlCache.get(cedula)!;
  }

  const baseUrl = 'https://admon.sao6.com.co/web/uploads/empleados/';
  const extensions = ['jpg', 'jpeg', 'png'];
  
  // Probar cada extensión para ver cuál existe
  for (const ext of extensions) {
    try {
      const url = `${baseUrl}${cedula}.${ext}`;
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        logger.info({ cedula, extension: ext, url }, 'Imagen encontrada');
        // Guardar en cache
        photoUrlCache.set(cedula, url);
        photoUrlCacheExpiry.set(cedula, now + CACHE_TTL);
        return url;
      }
    } catch (error) {
      // Continuar con la siguiente extensión
      continue;
    }
  }
  
  // Si no se encuentra ninguna imagen, usar jpg como fallback
  const fallbackUrl = `${baseUrl}${cedula}.jpg`;
  logger.warn({ cedula }, 'No se encontró imagen para el operador, usando jpg como fallback');
  // Guardar fallback en cache también
  photoUrlCache.set(cedula, fallbackUrl);
  photoUrlCacheExpiry.set(cedula, now + CACHE_TTL);
  return fallbackUrl;
};

// Función para obtener información del operador
export const getOperatorInfo = async (operatorCode: string) => {
  try {
    const pool = await getSqlServerConnection();
    
    logger.info({ operatorCode }, 'Iniciando consulta de información del operador');
    
    // Primero verificar si la tabla existe
    const tableCheckQuery = `
      SELECT COUNT(*) as tableExists
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'BI_W0550'
    `;
    
    logger.debug({ tableCheckQuery }, 'Verificando existencia de tabla BI_W0550');
    
    const tableCheck = await pool.request()
      .query(tableCheckQuery);
    
    logger.info({ tableExists: tableCheck.recordset[0].tableExists }, 'Resultado de verificación de tabla');
    
    if (tableCheck.recordset[0].tableExists === 0) {
      logger.warn('La tabla BI_W0550 no existe en SQL Server, devolviendo información por defecto');
      const cedulaLimpia = operatorCode.trim();
      const fotoUrl = await getPhotoUrl(cedulaLimpia);
      return {
        cedula: cedulaLimpia,
        nombre: 'Información no disponible',
        cargo: 'No especificado',
        fechaIngreso: 'No disponible',
        id: 'No disponible',
        foto: fotoUrl
      };
    }
    
    // Consulta para obtener información del operador
    const operatorQuery = `
      SELECT TOP 1
        F200_ID as cedula,
        f200_razon_social as nombre,
        C0763_DESCRIPCION as cargo,
        C0550_FECHA_INGRESO as fechaIngreso,
        C0550_ID as id
      FROM (
        SELECT 
          F200_ID,
          f200_razon_social,
          C0763_DESCRIPCION,
          C0550_FECHA_INGRESO,
          C0550_ID,
          ROW_NUMBER() OVER (ORDER BY C0550_ID DESC) as rn
        FROM UNOEE.dbo.BI_W0550 
        WHERE F200_ID = @operatorCode
      ) ranked
      WHERE ranked.rn = 1
    `;
    
    logger.debug({ operatorQuery, operatorCode }, 'Ejecutando consulta de información del operador');
    
    const result = await pool.request()
      .input('operatorCode', sql.VarChar, operatorCode)
      .query(operatorQuery);

    logger.info({ 
      recordCount: result.recordset.length,
      records: result.recordset 
    }, 'Resultado de la consulta del operador');

    if (result.recordset.length === 0) {
      logger.warn({ operatorCode }, 'No se encontró información del operador en SQL Server');
      return null;
    }

    const operator = result.recordset[0];
    
    // Limpiar la cédula para quitar espacios
    const cedulaLimpia = operator.cedula ? operator.cedula.toString().trim() : '';
    
    logger.info({ 
      cedula: operator.cedula,
      cedulaLimpia,
      nombre: operator.nombre,
      cargo: operator.cargo,
      fechaIngreso: operator.fechaIngreso,
      id: operator.id
    }, 'Datos del operador encontrados');
    
    // Formatear la fecha de ingreso
    let fechaIngreso = '';
    if (operator.fechaIngreso) {
      const fecha = operator.fechaIngreso.toString();
      if (fecha.length === 8) {
        // Formato YYYYMMDD
        const year = fecha.substring(0, 4);
        const month = fecha.substring(4, 6);
        const day = fecha.substring(6, 8);
        fechaIngreso = `${day}/${month}/${year}`;
      } else {
        fechaIngreso = fecha;
      }
    }

    // Generar URL de la foto del empleado con cédula limpia
    const fotoUrl = await getPhotoUrl(cedulaLimpia);

    const response = {
      cedula: cedulaLimpia,
      nombre: operator.nombre || '',
      cargo: operator.cargo || '',
      fechaIngreso: fechaIngreso,
      id: operator.id || '',
      foto: fotoUrl
    };
    
    logger.info(response, 'Respuesta final del operador');
    
    return response;

  } catch (error) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      operatorCode 
    }, 'Error al obtener información del operador');
    
    // En caso de error, devolver información por defecto
    const cedulaLimpia = operatorCode.trim();
    const fotoUrl = await getPhotoUrl(cedulaLimpia);
    return {
      cedula: cedulaLimpia,
      nombre: 'Información no disponible',
      cargo: 'No especificado',
      fechaIngreso: 'No disponible',
      id: 'No disponible',
      foto: fotoUrl
    };
  }
};

// Función para obtener información de empleado de tabla SE_w0550
export const getEmployeeFromSE = async (cedula: string) => {
  try {
    const pool = await getSqlServerConnection();
    
    logger.info({ cedula }, 'Iniciando consulta de empleado en tabla SE_w0550');
    
    // Primero verificar si la tabla existe
    const tableCheckQuery = `
      SELECT COUNT(*) as tableExists
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'SE_w0550'
    `;
    
    logger.debug({ tableCheckQuery }, 'Verificando existencia de tabla SE_w0550');
    
    const tableCheck = await pool.request()
      .query(tableCheckQuery);
    
    logger.info({ tableExists: tableCheck.recordset[0].tableExists }, 'Resultado de verificación de tabla SE_w0550');
    
    if (tableCheck.recordset[0].tableExists === 0) {
      logger.warn('La tabla SE_w0550 no existe en SQL Server');
      return null;
    }
    
    // Consulta para obtener información del empleado con filtros específicos
    const employeeQuery = `
      SELECT TOP 1
        f_nit_empl as cedula,
        f_nombre_empl as nombre,
        f_desc_cargo as cargo,
        f_desc_Ccosto as centroCosto,
        f_fecha_ingreso as fechaIngreso,
        f_email_contacto as email,
        f_ndc,
        f_parametro,
        f_fecha_nacimiento_emp as fechaNacimiento,
        f_fecha_retiro as fechaRetiro
      FROM (
        SELECT 
          f_nit_empl,
          f_nombre_empl,
          f_desc_cargo,
          f_desc_Ccosto,
          f_fecha_ingreso,
          f_email_contacto,
          f_ndc,
          f_parametro,
          f_fecha_nacimiento_emp,
          f_fecha_retiro,
          ROW_NUMBER() OVER (ORDER BY f_ndc DESC, f_parametro DESC) as rn
        FROM UNOEE.dbo.SE_w0550 
        WHERE f_nit_empl = @cedula 
        AND (f_desc_Ccosto = 'Tecnicos de Mantenimiento' OR f_desc_Ccosto = 'Gestion de Mantenimiento')
      ) ranked
      WHERE ranked.rn = 1
    `;
    
    logger.debug({ employeeQuery, cedula }, 'Ejecutando consulta de empleado en SE_w0550');
    
    const result = await pool.request()
      .input('cedula', sql.VarChar, cedula)
      .query(employeeQuery);

    logger.info({ 
      recordCount: result.recordset.length,
      records: result.recordset 
    }, 'Resultado de la consulta del empleado en SE_w0550');

    if (result.recordset.length === 0) {
      logger.warn({ cedula }, 'No se encontró empleado en SE_w0550 con los centros de costo permitidos');
      return null;
    }

    const employee = result.recordset[0];
    
    // Limpiar la cédula para quitar espacios
    const cedulaLimpia = employee.cedula ? employee.cedula.toString().trim() : '';
    
    logger.info({ 
      cedula: employee.cedula,
      cedulaLimpia,
      nombre: employee.nombre,
      cargo: employee.cargo,
      centroCosto: employee.centroCosto,
      fechaIngreso: employee.fechaIngreso,
      email: employee.email
    }, 'Datos del empleado encontrados en SE_w0550');
    
    // Generar URL de la foto del empleado con cédula limpia
    const fotoUrl = await getPhotoUrl(cedulaLimpia);

    const response = {
      cedula: cedulaLimpia,
      nombre: employee.nombre || '',
      cargo: employee.cargo || '',
      centroCosto: employee.centroCosto || '',
      fechaIngreso: employee.fechaIngreso || null,
      email: employee.email || '',
      fechaNacimiento: employee.fechaNacimiento || null,
      fechaRetiro: employee.fechaRetiro || null,
      foto: fotoUrl
    };
    
    logger.info(response, 'Respuesta final del empleado desde SE_w0550');
    
    return response;

  } catch (error) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      cedula 
    }, 'Error al obtener información del empleado desde SE_w0550');
    
    return null;
  }
};

// Función para cerrar la conexión
// Función para obtener todos los empleados de mantenimiento
export const getMaintenanceEmployees = async () => {
  const pool = await getSqlServerConnection();
  
  // Primero, hacer una consulta de diagnóstico para entender los datos
  const diagnosticResult = await pool.request()
    .query(`
      -- Diagnóstico: Total de registros sin filtros
      SELECT 'Total registros' as tipo, COUNT(*) as cantidad
      FROM UNOEE.dbo.SE_w0550
      
      UNION ALL
      
      -- Registros con centros de costo de mantenimiento (exacto)
      SELECT 'Con centros exactos' as tipo, COUNT(*) as cantidad
      FROM UNOEE.dbo.SE_w0550 
      WHERE f_desc_Ccosto = 'Tecnicos de Mantenimiento' OR f_desc_Ccosto = 'Gestion de Mantenimiento'
      
      UNION ALL
      
      -- Registros con centros de costo que contienen las palabras (por si hay espacios extra)
      SELECT 'Con centros LIKE' as tipo, COUNT(*) as cantidad
      FROM UNOEE.dbo.SE_w0550 
      WHERE f_desc_Ccosto LIKE '%Tecnicos de Mantenimiento%' OR f_desc_Ccosto LIKE '%Gestion de Mantenimiento%'
      
      UNION ALL
      
      -- Registros activos (sin fecha de retiro o fecha futura)
      SELECT 'Activos' as tipo, COUNT(*) as cantidad
      FROM UNOEE.dbo.SE_w0550 
      WHERE f_fecha_retiro IS NULL OR f_fecha_retiro > GETDATE()
      
      UNION ALL
      
      -- Registros únicos por empleado
      SELECT 'Empleados únicos' as tipo, COUNT(DISTINCT f_nit_empl) as cantidad
      FROM UNOEE.dbo.SE_w0550 
      WHERE (f_desc_Ccosto LIKE '%Tecnicos de Mantenimiento%' OR f_desc_Ccosto LIKE '%Gestion de Mantenimiento%')
      AND (f_fecha_retiro IS NULL OR f_fecha_retiro > GETDATE())
    `);
    
  logger.info('Diagnóstico de datos de mantenimiento:', diagnosticResult.recordset);
  
  // También obtener una muestra de los centros de costo únicos para ver variaciones
  const costCenterResult = await pool.request()
    .query(`
      SELECT DISTINCT f_desc_Ccosto, COUNT(*) as cantidad
      FROM UNOEE.dbo.SE_w0550 
      WHERE f_desc_Ccosto LIKE '%Mantenimiento%' OR f_desc_Ccosto LIKE '%mantenimiento%'
      GROUP BY f_desc_Ccosto
      ORDER BY cantidad DESC
    `);
    
  logger.info('Centros de costo con "mantenimiento":', costCenterResult.recordset);
  
  // Consulta principal - eliminar duplicados usando f_ndc y f_parametro más altos
  const result = await pool.request()
    .query(`
      SELECT 
        f_nit_empl as cedula,
        f_nombre_empl as nombre,
        f_desc_cargo as cargo,
        f_desc_Ccosto as centroCosto,
        f_fecha_ingreso as fechaIngreso,
        f_email_contacto as email,
        f_ndc,
        f_parametro,
        f_fecha_nacimiento_emp as fechaNacimiento,
        f_fecha_retiro as fechaRetiro
      FROM (
        SELECT 
          f_nit_empl,
          f_nombre_empl,
          f_desc_cargo,
          f_desc_Ccosto,
          f_fecha_ingreso,
          f_email_contacto,
          f_ndc,
          f_parametro,
          f_fecha_nacimiento_emp,
          f_fecha_retiro,
          ROW_NUMBER() OVER (PARTITION BY f_nit_empl ORDER BY f_ndc DESC, f_parametro DESC) as rn
        FROM UNOEE.dbo.SE_w0550 
        WHERE (f_desc_Ccosto = 'Tecnicos de Mantenimiento' OR f_desc_Ccosto = 'Gestion de Mantenimiento')
        AND (f_fecha_retiro IS NULL OR f_fecha_retiro > GETDATE())
      ) ranked
      WHERE ranked.rn = 1
      ORDER BY f_nombre_empl
    `);
    
  logger.debug({ employeeCount: result.recordset.length }, 'Empleados de mantenimiento obtenidos desde SE_w0550');
  
  // Usar la función rápida sin verificación HTTP para mejorar performance
  const employees = result.recordset.map((emp: any) => {
    const cedulaLimpia = emp.cedula ? emp.cedula.toString().trim() : '';
    const fotoUrl = getPhotoUrlFast(cedulaLimpia);
    return {
      code: cedulaLimpia,
      name: emp.nombre || '',
      telefone: '',
      password: cedulaLimpia,
      cargo: emp.cargo || '',
      role: 'employee' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      avatar: fotoUrl,
      estado: 'activo' as const,
      fechaIngreso: emp.fechaIngreso,
      direccion: '',
      area: emp.centroCosto || '',
      email: emp.email || ''
    };
  });

  return employees;
}

// Función para buscar empleado por cédula en centro de costo "Gestion de Operaciones"
export async function getEmployeeFromOperations(cedula: string) {
  logger.info({ cedula }, 'Iniciando consulta de empleado de operaciones en tabla SE_w0550');
  
  try {
    // Verificar que la tabla existe
    const pool = await getSqlServerConnection();
    const tableCheck = await pool.request()
      .query(`
        SELECT COUNT(*) as tableExists
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'SE_w0550'
      `);
    
    logger.debug({ 
      tableCheckQuery: `
      SELECT COUNT(*) as tableExists
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'SE_w0550'
    ` 
    }, 'Verificando existencia de tabla SE_w0550');
    
    logger.info({ tableExists: tableCheck.recordset[0].tableExists }, 'Resultado de verificación de tabla SE_w0550');
    
    if (tableCheck.recordset[0].tableExists === 0) {
      logger.warn('Tabla SE_w0550 no encontrada');
      return null;
    }

    // Consultar empleado por cédula en centro de costo "Gestion de Operaciones"
    const employeeQuery = `
      SELECT TOP 1
        f_nit_empl as cedula,
        f_nombre_empl as nombre,
        f_desc_cargo as cargo,
        f_desc_Ccosto as centroCosto,
        f_fecha_ingreso as fechaIngreso,
        f_email_contacto as email,
        f_ndc,
        f_parametro,
        f_fecha_nacimiento_emp as fechaNacimiento,
        f_fecha_retiro as fechaRetiro
      FROM (
        SELECT 
          f_nit_empl,
          f_nombre_empl,
          f_desc_cargo,
          f_desc_Ccosto,
          f_fecha_ingreso,
          f_email_contacto,
          f_ndc,
          f_parametro,
          f_fecha_nacimiento_emp,
          f_fecha_retiro,
          ROW_NUMBER() OVER (ORDER BY f_ndc DESC, f_parametro DESC) as rn
        FROM UNOEE.dbo.SE_w0550 
        WHERE f_nit_empl = @cedula 
        AND f_desc_Ccosto IN ('Gestion de Operaciones', 'Operador Vehículo', 'Operador Dual')
      ) ranked
      WHERE ranked.rn = 1
    `;

    logger.debug({ 
      employeeQuery,
      cedula 
    }, 'Ejecutando consulta de empleado de operaciones en SE_w0550');

    const result = await pool.request()
      .input('cedula', sql.VarChar, cedula)
      .query(employeeQuery);

    logger.info({ 
      recordCount: result.recordset.length,
      records: result.recordset 
    }, 'Resultado de la consulta del empleado de operaciones en SE_w0550');

    if (result.recordset.length === 0) {
      logger.warn({ cedula }, 'No se encontró empleado en SE_w0550 con centro de costo "Gestion de Operaciones"');
      return null;
    }

    const employee = result.recordset[0];
    const cedulaLimpia = employee.cedula ? employee.cedula.toString().trim() : cedula;

    logger.info({
      cedula,
      cedulaLimpia,
      nombre: employee.nombre,
      cargo: employee.cargo,
      centroCosto: employee.centroCosto,
      fechaIngreso: employee.fechaIngreso,
      email: employee.email
    }, 'Datos del empleado de operaciones encontrados en SE_w0550');

    // Intentar obtener la foto del empleado
    let fotoUrl;
    try {
      fotoUrl = await getPhotoUrl(cedulaLimpia);
    } catch (error) {
      logger.warn({ cedula: cedulaLimpia }, 'No se encontró imagen para el operador, usando jpg como fallback');
      fotoUrl = `https://admon.sao6.com.co/web/uploads/empleados/${cedulaLimpia}.jpg`;
    }

    const employeeData = {
      f_nit_empl: cedulaLimpia,
      f_nombre_empl: employee.nombre || '',
      f_desc_cargo: employee.cargo || '',
      f_desc_Ccosto: employee.centroCosto || '',
      f_fecha_ingreso: employee.fechaIngreso,
      f_email_contacto: employee.email || '',
      f_fecha_nacimiento_emp: employee.fechaNacimiento,
      f_fecha_retiro: employee.fechaRetiro,
      foto: fotoUrl
    };

    logger.info({
      cedula,
      nombre: employee.nombre,
      cargo: employee.cargo,
      centroCosto: employee.centroCosto,
      fechaIngreso: employee.fechaIngreso,
      email: employee.email,
      fechaNacimiento: employee.fechaNacimiento,
      fechaRetiro: employee.fechaRetiro,
      foto: fotoUrl
    }, 'Respuesta final del empleado de operaciones desde SE_w0550');

    return employeeData;

  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : 'Error desconocido', cedula }, 'Error al consultar empleado de operaciones en SE_w0550');
    throw error;
  }
};

export const closeSqlServerConnection = async () => {
  if (sqlServerPool) {
    await sqlServerPool.close();
    sqlServerPool = null;
    logger.info('Conexión a SQL Server cerrada');
  }
};

export default sqlServerConfig;