# Estructura Profesional de Archivos - Sistema de Solicitud de Permisos

## Descripción

Este sistema implementa una estructura de carpetas profesional para organizar los archivos adjuntos a las solicitudes de permisos de manera jerárquica y ordenada.

## Estructura de Directorios

```
uploads/
├── YYYY/                    # Año de la solicitud
│   ├── MM/                  # Mes de la solicitud (01-12)
│   │   ├── cedula_usuario/  # Cédula del usuario (sanitizada)
│   │   │   ├── solicitud_ID_tipo/  # Carpeta específica de la solicitud
│   │   │   │   ├── archivo1.ext
│   │   │   │   ├── archivo2.ext
│   │   │   │   └── ...
│   │   │   └── solicitud_ID2_tipo/
│   │   └── otra_cedula/
│   └── 02/
└── 2025/
```

### Ejemplo Práctico

```
uploads/
├── 2024/
│   ├── 01/
│   │   ├── 12345678/
│   │   │   ├── solicitud_123_cita/
│   │   │   │   ├── 12345678_cita_1704067200000_1_documento_medico.pdf
│   │   │   │   └── 12345678_cita_1704067200000_2_radiografia.jpg
│   │   │   └── solicitud_124_licencia/
│   │   │       └── 12345678_licencia_1704153600000_1_certificado.pdf
│   │   └── 87654321/
│   │       └── solicitud_125_audiencia/
│   │           └── 87654321_audiencia_1704240000000_1_citacion.pdf
│   └── 02/
│       └── 12345678/
│           └── solicitud_126_descanso/
│               └── 12345678_descanso_1706659200000_1_incapacidad.pdf
```

## Nomenclatura de Archivos

Cada archivo sigue el siguiente patrón:

```
{cedula}_{tipo_novedad}_{timestamp}_{indice}_{nombre_original}.{extension}
```

### Componentes:

- **cedula**: Cédula del usuario (sanitizada, sin caracteres especiales)
- **tipo_novedad**: Tipo de solicitud (cita, audiencia, licencia, descanso, etc.)
- **timestamp**: Marca de tiempo Unix en milisegundos
- **indice**: Número secuencial del archivo (1, 2, 3, ...)
- **nombre_original**: Nombre original del archivo (sanitizado, máximo 50 caracteres)
- **extension**: Extensión del archivo (.pdf, .jpg, .jpeg, .png)

## Características de Seguridad

### Sanitización
- Los nombres de archivos y carpetas son sanitizados para remover caracteres especiales
- Solo se permiten caracteres alfanuméricos, guiones y guiones bajos
- Los caracteres peligrosos como `<>:"/\|?*` son reemplazados por `_`

### Validación de Rutas
- Se previenen ataques de path traversal (`../`)
- Los archivos solo pueden ser accedidos dentro del directorio `uploads/`
- Validación estricta de tipos de archivo permitidos

### Control de Acceso
- Los archivos son servidos a través de rutas controladas
- Verificación de permisos antes de servir archivos
- Logs detallados de acceso a archivos

## Beneficios de esta Estructura

### Organización
- **Cronológica**: Fácil localización por año y mes
- **Por Usuario**: Todos los archivos de un usuario en un lugar
- **Por Solicitud**: Archivos agrupados por solicitud específica

### Escalabilidad
- Distribución equilibrada de archivos
- Evita directorios con miles de archivos
- Facilita backups y mantenimiento

### Trazabilidad
- Nombres de archivo descriptivos
- Metadatos completos en base de datos
- Historial completo de uploads

### Mantenimiento
- Fácil identificación de archivos antiguos
- Posibilidad de archivado por períodos
- Limpieza automática por fechas

## Implementación Técnica

### Funciones Principales

1. **createRequestDirectory()**: Crea la estructura de directorios
2. **generateFileName()**: Genera nombres únicos y descriptivos
3. **getRelativeFilePath()**: Obtiene rutas relativas para la base de datos

### Proceso de Upload

1. Validación de archivos
2. Creación de directorio temporal
3. Guardado inicial de archivos
4. Inserción en base de datos (obtención de ID)
5. Creación de estructura final con ID real
6. Movimiento de archivos a ubicación final
7. Actualización de base de datos con rutas finales
8. Limpieza de archivos temporales

### Servicio de Archivos

- Endpoint: `GET /files/*`
- Soporte para rutas anidadas
- Validación de seguridad
- Headers optimizados para cache
- Logs detallados de acceso

## Configuración

### Variables de Entorno

```env
UPLOAD_DIR=uploads                    # Directorio base de uploads
MAX_FILE_SIZE=10485760                # Tamaño máximo: 10MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf
```

### Tipos de Archivo Permitidos

- **Imágenes**: JPG, JPEG, PNG
- **Documentos**: PDF
- **Tamaño máximo**: 10MB por archivo

## Monitoreo y Logs

El sistema registra:

- Creación de directorios
- Upload de archivos
- Acceso a archivos
- Errores y excepciones
- Métricas de rendimiento

## Migración de Datos Existentes

Para migrar archivos existentes a la nueva estructura:

1. Ejecutar script de migración
2. Mover archivos a nuevas ubicaciones
3. Actualizar rutas en base de datos
4. Verificar integridad de datos
5. Limpiar archivos antiguos

---

**Nota**: Esta estructura fue implementada para mejorar la organización, seguridad y escalabilidad del sistema de gestión de archivos en las solicitudes de permisos.