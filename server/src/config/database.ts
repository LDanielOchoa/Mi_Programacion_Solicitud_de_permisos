import mysql from 'mysql2/promise';
import logger from './logger.js';
import { DatabaseConfig } from '../types/index.js';

const config: DatabaseConfig = {
  host: process.env.DB_HOST || '192.168.90.32',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'desarrollo',
  password: process.env.DB_PASSWORD || 'test_24*',
  database: process.env.DB_NAME || 'bdsaocomco_solicitudpermisos',
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000
};

// Configuración del pool de conexiones
const pool = mysql.createPool({
  host: process.env.DB_HOST || '192.168.90.32',
  user: process.env.DB_USER || 'desarrollo',
  password: process.env.DB_PASSWORD || 'test_24*',
  database: process.env.DB_NAME || 'bdsaocomco_solicitudpermisos',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Función para obtener conexión del pool
export const getConnection = async () => {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    logger.error('Error al obtener conexión de la base de datos:', error);
    throw error;
  }
};

// Función para probar la conexión
export const testConnection = async (): Promise<boolean> => {
  try {
    const connection = await pool.getConnection();
    logger.info('🎉 Conexión a la base de datos establecida exitosamente');
    connection.release();
    return true;
  } catch (error) {
    logger.error('❌ Error al conectar con la base de datos:', error);
    return false;
  }
};

interface ExecuteQueryOptions {
  commit?: boolean;
  fetchOne?: boolean;
  fetchAll?: boolean;
}

// Función genérica para ejecutar consultas
export const executeQuery = async <T>(
  sql: string, 
  params: any[], 
  options: ExecuteQueryOptions = {}
): Promise<T | null | any> => {
  let connection: mysql.PoolConnection | null = null;
  try {
    connection = await pool.getConnection();
    
    if (options.commit) {
      await connection.beginTransaction();
    }

    logger.debug({ sql, params }, 'Executing query');
    const [results] = await connection.execute(sql, params);

    if (options.commit) {
      await connection.commit();
    }
    
    if (options.fetchOne) {
      return (results as any)[0] || null;
    }
    
    if (options.fetchAll) {
      return results;
    }

    return results;

  } catch (error) {
    if (connection && options.commit) {
      await connection.rollback();
    }
    
    // Log detallado del error
    logger.error({ 
      sql, 
      params, 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      code: error instanceof Error && 'code' in error ? (error as any).code : undefined,
      errno: error instanceof Error && 'errno' in error ? (error as any).errno : undefined
    }, 'Query execution failed');
    
    throw error; // Re-lanzar el error para que sea manejado por el error handler global

  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Función para cerrar el pool de conexiones
export const closePool = async () => {
  try {
    await pool.end();
    logger.info('Pool de conexiones cerrado');
  } catch (error) {
    logger.error('Error cerrando el pool de conexiones:', error);
  }
};

// Función para transacciones
export const executeTransaction = async (
  queries: Array<{ query: string; params: any[] }>
): Promise<any[]> => {
  let connection;
  
  try {
    connection = await getConnection();
    await connection.beginTransaction();
    
    const results = [];
    
    for (const { query, params } of queries) {
      const [result] = await connection.execute(query, params);
      results.push(result);
    }
    
    await connection.commit();
    return results;
    
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    logger.error('Error en transacción:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

export default pool; 