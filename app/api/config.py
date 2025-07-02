import os
from typing import Optional

class Settings:
    # Database
    DATABASE_HOST: str = "192.168.90.32"
    DATABASE_PORT: int = 3306
    DATABASE_USER: str = "desarrollo"
    DATABASE_PASSWORD: str = "test_24*"
    DATABASE_NAME: str = "bdsaocomco_solicitudpermisos"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    DATABASE_POOL_TIMEOUT: int = 30
    DATABASE_POOL_RECYCLE: int = 3600  
    
    # Authentication
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    ALLOWED_ORIGINS: list = ["*"]
    
    # File Upload
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES: list = ["image/jpeg", "image/png", "application/pdf"]
    
    # Cache
    CACHE_TTL: int = 300  # 5 minutos
    REDIS_URL: Optional[str] = None
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # Performance
    REQUEST_TIMEOUT: int = 30
    MAX_CONCURRENT_REQUESTS: int = 100
    
    def __init__(self):
        # Inicializar con valores por defecto
        pass

settings = Settings() 