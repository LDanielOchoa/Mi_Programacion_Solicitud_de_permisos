import mysql.connector
from mysql.connector import Error, pooling
from contextlib import contextmanager
import threading
import time

# Pool de conexiones para mejor rendimiento
connection_pool = None
pool_lock = threading.Lock()

def initialize_pool():
    """Inicializa el pool de conexiones"""
    global connection_pool
    if connection_pool is None:
        with pool_lock:
            if connection_pool is None:  # Double-check locking
                try:
                    connection_pool = mysql.connector.pooling.MySQLConnectionPool(
                        pool_name="mysql_pool",
                        pool_size=10,
                        pool_reset_session=True,
                        host="192.168.90.32",
                        port=3306,
                        user="desarrollo",
                        password="test_24*",
                        database="bdsaocomco_solicitudpermisos",
                        autocommit=False,
                        charset='utf8mb4',
                        collation='utf8mb4_unicode_ci',
                        connect_timeout=10,
                        sql_mode='STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO'
                    )
                    print("Pool de conexiones MySQL inicializado exitosamente")
                except Error as e:
                    print(f"Error inicializando pool de conexiones: {e}")
                    connection_pool = None

def create_connection():
    """Función original mantenida para compatibilidad"""
    try:
        # Intenta usar el pool primero
        if connection_pool:
            try:
                return connection_pool.get_connection()
            except Error as pool_error:
                print(f"Error obteniendo conexión del pool: {pool_error}")
        
        # Fallback a conexión directa si falla el pool
        connection = mysql.connector.connect(
            host="192.168.90.32",
            port=3306,
            user="desarrollo",
            password="test_24*",
            database="bdsaocomco_solicitudpermisos",
            autocommit=False,
            charset='utf8mb4',
            collation='utf8mb4_unicode_ci'
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL Database: {e}")
        return None

def close_connection(connection):
    """Función original mantenida para compatibilidad"""
    if connection:
        try:
            connection.close()
        except Error as e:
            print(f"Error cerrando conexión: {e}")

@contextmanager
def get_db_connection():
    """Context manager para manejo automático de conexiones"""
    initialize_pool()
    connection = create_connection()
    if connection is None:
        raise Exception("No se pudo establecer conexión a la base de datos")
    
    try:
        yield connection
    except Exception as e:
        try:
            connection.rollback()
        except:
            pass
        raise e
    finally:
        close_connection(connection)

def execute_query(query, params=None, fetch_one=False, fetch_all=False, commit=False):
    """Ejecutor optimizado de queries con manejo automático de conexiones"""
    with get_db_connection() as connection:
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute(query, params or ())
            
            if commit:
                connection.commit()
                return cursor.lastrowid if query.strip().upper().startswith('INSERT') else cursor.rowcount
            
            if fetch_one:
                return cursor.fetchone()
            elif fetch_all:
                return cursor.fetchall()
                
            return True
        finally:
            cursor.close()

# Inicializar pool al importar el módulo
initialize_pool()
