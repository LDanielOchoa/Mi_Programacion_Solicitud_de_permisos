-- Agregar campo userType a la tabla permit_perms para discriminar tipos de usuario
ALTER TABLE permit_perms 
ADD COLUMN userType VARCHAR(20) DEFAULT 'registered' 
COMMENT 'Tipo de usuario: registered (usuario normal) o se_maintenance (personal de mantenimiento)';

-- Actualizar registros existentes basándose en si el usuario existe en la tabla users
UPDATE permit_perms p
LEFT JOIN users u ON p.code = u.code
SET p.userType = CASE 
    WHEN u.userType IS NOT NULL THEN u.userType
    WHEN u.code IS NULL THEN 'se_maintenance'  -- Si no está en users, probablemente es de mantenimiento
    ELSE 'registered'
END;

-- Crear índice para mejorar consultas por tipo de usuario
CREATE INDEX idx_permit_perms_userType ON permit_perms(userType);

-- Verificar la actualización
SELECT 
    userType,
    COUNT(*) as total_solicitudes,
    COUNT(DISTINCT code) as usuarios_unicos
FROM permit_perms 
GROUP BY userType;
