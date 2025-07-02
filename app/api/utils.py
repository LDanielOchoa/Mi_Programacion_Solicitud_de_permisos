import asyncio
import time
from functools import wraps
from typing import Dict, Any, List, Optional
from fastapi import HTTPException
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cache simple para consultas frecuentes
query_cache: Dict[str, Dict[str, Any]] = {}
cache_timestamps: Dict[str, float] = {}
QUERY_CACHE_TTL = 60  # 1 minuto para queries frecuentes

def cache_query_result(cache_key: str, result: Any, ttl: int = QUERY_CACHE_TTL):
    """Cachea el resultado de una query"""
    query_cache[cache_key] = result
    cache_timestamps[cache_key] = time.time()

def get_cached_query_result(cache_key: str, ttl: int = QUERY_CACHE_TTL) -> Optional[Any]:
    """Obtiene resultado cacheado si es válido"""
    if cache_key in query_cache:
        timestamp = cache_timestamps.get(cache_key, 0)
        if time.time() - timestamp < ttl:
            return query_cache[cache_key]
        else:
            # Cache expirado
            query_cache.pop(cache_key, None)
            cache_timestamps.pop(cache_key, None)
    return None

def clear_query_cache(pattern: str = None):
    """Limpia cache de queries"""
    if pattern:
        keys_to_remove = [key for key in query_cache.keys() if pattern in key]
        for key in keys_to_remove:
            query_cache.pop(key, None)
            cache_timestamps.pop(key, None)
    else:
        query_cache.clear()
        cache_timestamps.clear()

def log_performance(func):
    """Decorator para medir tiempo de ejecución"""
    @wraps(func)
    async def async_wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = await func(*args, **kwargs)
            end_time = time.time()
            logger.info(f"{func.__name__} ejecutado en {end_time - start_time:.3f}s")
            return result
        except Exception as e:
            end_time = time.time()
            logger.error(f"{func.__name__} falló en {end_time - start_time:.3f}s: {str(e)}")
            raise
    
    @wraps(func)
    def sync_wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            end_time = time.time()
            logger.info(f"{func.__name__} ejecutado en {end_time - start_time:.3f}s")
            return result
        except Exception as e:
            end_time = time.time()
            logger.error(f"{func.__name__} falló en {end_time - start_time:.3f}s: {str(e)}")
            raise
    
    return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper

def validate_file_type(content_type: str, allowed_types: List[str] = None) -> bool:
    """Valida tipo de archivo"""
    if allowed_types is None:
        allowed_types = ['image/jpeg', 'image/png', 'application/pdf']
    return content_type in allowed_types

def sanitize_filename(filename: str) -> str:
    """Sanitiza nombres de archivo"""
    import re
    # Remover caracteres peligrosos
    filename = re.sub(r'[^\w\-_\.]', '_', filename)
    # Limitar longitud
    if len(filename) > 100:
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        filename = name[:95] + ('.' + ext if ext else '')
    return filename

def create_cache_key(*args) -> str:
    """Crea clave única para cache basada en argumentos"""
    return "_".join(str(arg) for arg in args if arg is not None)

async def batch_execute_queries(queries_with_params: List[tuple], use_transaction: bool = True):
    """Ejecuta múltiples queries en batch para mejor rendimiento"""
    from database import get_db_connection
    
    results = []
    with get_db_connection() as connection:
        cursor = connection.cursor(dictionary=True)
        try:
            if use_transaction:
                connection.start_transaction()
            
            for query, params in queries_with_params:
                cursor.execute(query, params or ())
                if query.strip().upper().startswith('SELECT'):
                    results.append(cursor.fetchall())
                elif query.strip().upper().startswith('INSERT'):
                    results.append(cursor.lastrowid)
                else:
                    results.append(cursor.rowcount)
            
            if use_transaction:
                connection.commit()
            
            return results
        except Exception as e:
            if use_transaction:
                connection.rollback()
            logger.error(f"Error en batch_execute_queries: {str(e)}")
            raise
        finally:
            cursor.close()

class DatabaseOptimizer:
    """Clase para optimizaciones específicas de base de datos"""
    
    @staticmethod
    def get_users_by_role_cached(role: str = 'employee') -> List[Dict]:
        """Obtiene usuarios por rol con cache"""
        cache_key = f"users_by_role_{role}"
        cached_result = get_cached_query_result(cache_key, ttl=300)  # 5 minutos
        
        if cached_result is not None:
            return cached_result
        
        from database import execute_query
        try:
            users = execute_query(
                "SELECT code, name, role FROM users WHERE role = %s ORDER BY code",
                (role,),
                fetch_all=True
            )
            result = users or []
            cache_query_result(cache_key, result, ttl=300)
            return result
        except Exception as e:
            logger.error(f"Error obteniendo usuarios por rol {role}: {str(e)}")
            return []
    
    @staticmethod
    def invalidate_user_caches(user_code: str = None):
        """Invalida caches relacionados con usuarios"""
        if user_code:
            clear_query_cache(f"user_{user_code}")
        clear_query_cache("users_by_role")

# Inicialización de métricas básicas
performance_metrics = {
    'total_requests': 0,
    'failed_requests': 0,
    'cache_hits': 0,
    'cache_misses': 0,
    'average_response_time': 0.0
}

def update_performance_metrics(execution_time: float, success: bool = True, cache_hit: bool = False):
    """Actualiza métricas de rendimiento"""
    performance_metrics['total_requests'] += 1
    
    if not success:
        performance_metrics['failed_requests'] += 1
    
    if cache_hit:
        performance_metrics['cache_hits'] += 1
    else:
        performance_metrics['cache_misses'] += 1
    
    # Calcular promedio móvil simple
    total_requests = performance_metrics['total_requests']
    current_avg = performance_metrics['average_response_time']
    performance_metrics['average_response_time'] = (
        (current_avg * (total_requests - 1) + execution_time) / total_requests
    )

def get_performance_stats() -> Dict[str, Any]:
    """Obtiene estadísticas de rendimiento"""
    return performance_metrics.copy() 