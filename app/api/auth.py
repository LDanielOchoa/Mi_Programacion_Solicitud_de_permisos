from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from database import create_connection, close_connection

# Configuración
SECRET_KEY = "secret-key-123"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Esquema OAuth2 para extracción del token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

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

# Función para obtener al usuario actual desde el token
def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_code: str = payload.get("sub")
        if user_code is None:
            raise HTTPException(status_code=401, detail="No autenticado")
        
        connection = create_connection()
        if connection is None:
            raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")
        
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE code = %s", (user_code,))
        user = cursor.fetchone()
        
        close_connection(connection)
        
        if user is None:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
