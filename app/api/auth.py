from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from database import create_connection, close_connection, execute_query
import time
from typing import Optional

# Configuración
SECRET_KEY = "secret-key-123"  # TODO: Mover a variables de entorno
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Cache simple de usuarios para evitar consultas repetitivas
user_cache = {}
cache_timestamps = {}
CACHE_TTL = 300  # 5 minutos

# Esquema OAuth2 para extracción del token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_user_from_cache(user_code: str) -> Optional[dict]:
    """Obtiene usuario del caché si es válido"""
    if user_code in user_cache:
        timestamp = cache_timestamps.get(user_code, 0)
        if time.time() - timestamp < CACHE_TTL:
            return user_cache[user_code]
        else:
            # Cache expirado, remover entrada
            user_cache.pop(user_code, None)
            cache_timestamps.pop(user_code, None)
    return None

def cache_user(user_code: str, user_data: dict):
    """Almacena usuario en caché"""
    user_cache[user_code] = user_data
    cache_timestamps[user_code] = time.time()

def clear_user_cache(user_code: str = None):
    """Limpia caché de usuario específico o todo el caché"""
    if user_code:
        user_cache.pop(user_code, None)
        cache_timestamps.pop(user_code, None)
    else:
        user_cache.clear()
        cache_timestamps.clear()

# Función para verificar las contraseñas (sin cifrado)
def verify_password(plain_password, hashed_password):
    return plain_password == hashed_password

# Función para obtener la contraseña sin cifrar
def get_password_hash(password):
    return password

# Función para crear un token de acceso
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Función optimizada para obtener al usuario actual desde el token
def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_code: str = payload.get("sub")
        if user_code is None:
            raise HTTPException(status_code=401, detail="No autenticado")
        
        # Intentar obtener del caché primero
        cached_user = get_user_from_cache(user_code)
        if cached_user:
            return cached_user
        
        # Si no está en caché, consultar base de datos
        try:
            user = execute_query(
                "SELECT * FROM users WHERE code = %s", 
                (user_code,), 
                fetch_one=True
            )
            
            if user is None:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")
            
            # Cachear usuario para futuras consultas
            cache_user(user_code, user)
            return user
            
        except Exception as db_error:
            # Fallback al método original si falla la optimización
            connection = create_connection()
            if connection is None:
                raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")
            
            cursor = connection.cursor(dictionary=True)
            cursor.execute("SELECT * FROM users WHERE code = %s", (user_code,))
            user = cursor.fetchone()
            
            close_connection(connection)
            
            if user is None:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")
            
            # Cachear usuario para futuras consultas
            cache_user(user_code, user)
            return user
            
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

# Función para limpiar caché cuando se actualiza un usuario
def refresh_user_cache(user_code: str):
    """Limpia caché de usuario cuando se actualiza su información"""
    clear_user_cache(user_code)
