-- Script para actualizar la base de datos con nuevas columnas para manejo de archivos
-- Ejecutar este script en la base de datos MySQL

USE bdsaocomco_solicitudpermisos;

-- Agregar nuevas columnas a la tabla permit_perms para manejo mejorado de archivos
ALTER TABLE permit_perms 
ADD COLUMN IF NOT EXISTS files_metadata JSON NULL COMMENT 'Metadatos completos de archivos subidos',
ADD COLUMN IF NOT EXISTS files_summary JSON NULL COMMENT 'Resumen de archivos subidos',
ADD COLUMN IF NOT EXISTS solicitud ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT 'Estado de la solicitud',
ADD COLUMN IF NOT EXISTS notifications ENUM('0', '1') DEFAULT '0' COMMENT 'Estado de notificaciones';

-- Actualizar columnas existentes si es necesario
ALTER TABLE permit_perms 
MODIFY COLUMN files TEXT NULL COMMENT 'Información de archivos subidos',
MODIFY COLUMN file_name TEXT NULL COMMENT 'Nombres de archivos',
MODIFY COLUMN file_url TEXT NULL COMMENT 'URLs de archivos';

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_permit_perms_code ON permit_perms(code);
CREATE INDEX IF NOT EXISTS idx_permit_perms_solicitud ON permit_perms(solicitud);
CREATE INDEX IF NOT EXISTS idx_permit_perms_tipo_novedad ON permit_perms(tipo_novedad);
CREATE INDEX IF NOT EXISTS idx_permit_perms_fecha ON permit_perms(fecha);
CREATE INDEX IF NOT EXISTS idx_permit_perms_time_created ON permit_perms(time_created);

-- Verificar que las columnas se agregaron correctamente
DESCRIBE permit_perms;

-- Mostrar información de la tabla actualizada
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'bdsaocomco_solicitudpermisos' 
AND TABLE_NAME = 'permit_perms'
ORDER BY ORDINAL_POSITION; 