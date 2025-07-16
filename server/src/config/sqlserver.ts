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

// Función para verificar qué extensión de imagen existe
const getPhotoUrl = async (cedula: string): Promise<string> => {
  const baseUrl = 'https://admon.sao6.com.co/web/uploads/empleados/';
  const extensions = ['jpg', 'jpeg', 'png'];
  
  // Probar cada extensión para ver cuál existe
  for (const ext of extensions) {
    try {
      const url = `${baseUrl}${cedula}.${ext}`;
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        logger.info({ cedula, extension: ext, url }, 'Imagen encontrada');
        return url;
      }
    } catch (error) {
      // Continuar con la siguiente extensión
      continue;
    }
  }
  
  // Si no se encuentra ninguna imagen, usar jpg como fallback
  logger.warn({ cedula }, 'No se encontró imagen para el operador, usando jpg como fallback');
  return `${baseUrl}${cedula}.jpg`;
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

// Función para cerrar la conexión
export const closeSqlServerConnection = async () => {
  if (sqlServerPool) {
    await sqlServerPool.close();
    sqlServerPool = null;
    logger.info('Conexión a SQL Server cerrada');
  }
};

export default sqlServerConfig; 