# Servidor de Solicitud de Permisos

Backend moderno desarrollado con **Hono** y **TypeScript** para el sistema de gestión de solicitudes de permisos y equipos.

## 🚀 Características

- **Framework moderno**: Hono con TypeScript para máximo rendimiento
- **Base de datos**: MySQL con pool de conexiones optimizado
- **Autenticación**: JWT con middleware de seguridad
- **Validación**: Esquemas Zod para validación de datos
- **Monitoreo**: Middleware de rendimiento y logging
- **Manejo de archivos**: Subida segura de archivos con validación
- **CORS**: Configuración flexible para desarrollo y producción
- **Manejo de errores**: Sistema robusto de manejo de errores

## 📋 Requisitos Previos

- Node.js 18+ 
- MySQL 8.0+
- npm o yarn

## 🛠️ Instalación Rápida

### Windows (PowerShell)
```powershell
# Ejecutar script de configuración
.\setup.ps1

# O manualmente:
npm install
copy env.example .env
mkdir uploads
```

### Linux/Mac (Bash)
```bash
# Ejecutar script de configuración
chmod +x setup.sh
./setup.sh

# O manualmente:
npm install
cp env.example .env
mkdir uploads
```

### Configuración Manual

1. **Instalar dependencias**
```bash
npm install
```

2. **Configurar variables de entorno**
```bash
# Windows
copy env.example .env

# Linux/Mac
cp env.example .env
```

3. **Editar archivo .env**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=solicitud_permisos

# JWT Configuration
JWT_SECRET=tu_clave_secreta_jwt_muy_segura_aqui
JWT_EXPIRES_IN=30m

# Server Configuration
PORT=8001
NODE_ENV=development

# Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf

# CORS Configuration
CORS_ORIGIN=*
```

4. **Crear directorio de uploads**
```bash
mkdir uploads
```

5. **Iniciar el servidor**
```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

## 📚 API Endpoints

### Autenticación
- `POST /auth/login` - Iniciar sesión
- `GET /auth/user` - Obtener información del usuario actual
- `POST /auth/update-phone` - Actualizar teléfono
- `GET /auth/user/:code` - Obtener usuario por código
- `GET /auth/users/list` - Listar usuarios empleados

### Solicitudes de Permisos
- `POST /permit-request` - Crear solicitud con archivos
- `POST /new-permit-request` - Crear solicitud sin archivos
- `GET /files/:filename` - Descargar archivo
- `POST /check-existing-requests` - Verificar solicitudes existentes
- `GET /permit-request/:id` - Obtener solicitud específica

### Solicitudes de Equipos
- `POST /equipment-request` - Crear solicitud de equipo

### Administración
- `GET /requests` - Obtener todas las solicitudes
- `GET /requests/:code` - Obtener solicitudes por usuario
- `PUT /requests/:id` - Actualizar solicitud
- `PUT /requests/:id/notifications` - Actualizar notificaciones
- `PUT /update-approval/:id` - Actualizar aprobación
- `DELETE /requests/:id` - Eliminar solicitud
- `GET /solicitudes` - Obtener solicitudes del usuario actual
- `GET /history/:code` - Obtener historial de usuario

### Gestión de Usuarios
- `GET /user/lists` - Listar todos los usuarios (admin)
- `POST /users` - Crear usuario (admin)
- `PUT /users/:code` - Actualizar usuario (admin)
- `DELETE /users/:code` - Eliminar usuario (admin)

### Exportación de Datos
- `GET /excel` - Exportar datos para Excel
- `GET /excel-novedades` - Exportar novedades
- `GET /historical-records` - Obtener registros históricos

### Sistema
- `GET /` - Información del servidor
- `GET /health` - Estado de salud
- `GET /stats/performance` - Estadísticas de rendimiento

## 🔧 Estructura del Proyecto

```
server/
├── src/
│   ├── config/
│   │   └── database.ts      # Configuración de MySQL
│   ├── middleware/
│   │   ├── auth.ts          # Middleware de autenticación
│   │   └── performance.ts   # Middleware de rendimiento
│   ├── routes/
│   │   ├── auth.ts          # Rutas de autenticación
│   │   ├── permits.ts       # Rutas de permisos
│   │   ├── equipment.ts     # Rutas de equipos
│   │   ├── admin.ts         # Rutas administrativas
│   │   ├── excel.ts         # Rutas de Excel
│   │   └── users.ts         # Rutas de usuarios
│   ├── schemas/
│   │   └── index.ts         # Esquemas de validación Zod
│   ├── types/
│   │   └── index.ts         # Definiciones de tipos TypeScript
│   └── index.ts             # Punto de entrada principal
├── uploads/                 # Directorio de archivos subidos
├── package.json
├── tsconfig.json
├── setup.sh                 # Script de configuración Linux/Mac
├── setup.ps1                # Script de configuración Windows
└── README.md
```

## 🔐 Autenticación

El sistema utiliza JWT (JSON Web Tokens) para la autenticación:

1. **Login**: `POST /auth/login` con `code` y `password`
2. **Token**: Se devuelve un token JWT válido por 30 minutos
3. **Autorización**: Incluir el token en el header `Authorization: Bearer <token>`

### Roles de Usuario
- **admin**: Acceso completo a todas las funciones
- **employee**: Acceso limitado a sus propias solicitudes

## 📁 Manejo de Archivos

- **Tipos permitidos**: JPEG, PNG, PDF
- **Tamaño máximo**: 10MB por archivo
- **Almacenamiento**: Local en directorio `uploads/`
- **Seguridad**: Validación de tipo MIME y extensión

## 📊 Monitoreo

El servidor incluye middleware de monitoreo que rastrea:
- Tiempo de respuesta promedio
- Tasa de éxito de requests
- Uso de memoria
- Uptime del servidor

Accede a las métricas en: `GET /stats/performance`

## 🛡️ Seguridad

- **CORS**: Configuración flexible para diferentes entornos
- **Validación**: Esquemas Zod para validar todos los inputs
- **Sanitización**: Prevención de inyección SQL con consultas parametrizadas
- **Autenticación**: JWT con expiración automática
- **Manejo de errores**: Sin exposición de información sensible

## 🚦 Scripts Disponibles

```bash
# Desarrollo con hot reload
npm run dev

# Compilar TypeScript
npm run build

# Iniciar en producción
npm start

# Linting
npm run lint
npm run lint:fix
```

## 🔍 Debugging

Para habilitar logs detallados:
```bash
NODE_ENV=development npm run dev
```

## 🚨 Solución de Problemas

### Error de dependencias
Si encuentras errores al instalar dependencias:
```bash
# Limpiar cache de npm
npm cache clean --force

# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error de conexión a MySQL
1. Verifica que MySQL esté corriendo
2. Confirma las credenciales en `.env`
3. Asegúrate de que la base de datos existe

### Error de puerto en uso
```bash
# Cambiar puerto en .env
PORT=8002
```

## 📝 Migración desde FastAPI

Este servidor es una migración completa desde FastAPI a Hono, manteniendo:
- ✅ Todos los endpoints originales
- ✅ Misma estructura de base de datos
- ✅ Compatibilidad con el frontend existente
- ✅ Funcionalidades de autenticación
- ✅ Manejo de archivos
- ✅ Validación de datos

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

Si encuentras algún problema o tienes preguntas:
1. Revisa la documentación
2. Verifica los logs del servidor
3. Comprueba la conexión a la base de datos
4. Crea un issue en el repositorio

---

**Desarrollado con ❤️ usando Hono y TypeScript** 