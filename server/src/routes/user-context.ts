import { Hono } from 'hono';
import { getCurrentUser } from '../middleware/auth.js';
import { enrichUserWithPermissions, UserContext } from '../middleware/permissions.js';
import { userHasPermission } from '../config/permissions.js';
import logger from '../config/logger.js';

const userContext = new Hono();

// Apply authentication and permission enrichment
userContext.use('*', getCurrentUser, enrichUserWithPermissions);

// GET /me - Obtener contexto del usuario actual con permisos
userContext.get('/me', async (c) => {
  try {
    const user = c.get('currentUser') as UserContext;
    
    if (!user) {
      return c.json({ 
        success: false, 
        message: 'Usuario no autenticado' 
      }, 401);
    }

    // Construir contexto completo del usuario
    const userContextData = {
      code: user.code,
      name: user.name,
      role: user.roleInfo?.name,
      displayName: user.roleInfo?.displayName,
      description: user.roleInfo?.description,
      userType: user.userType,
      permissions: user.permissions,
      
      // Capacidades específicas para la UI
      capabilities: {
        // Panel de administración
        canAccessAdminPanel: userHasPermission(user, 'admin:panel'),
        canViewAnalytics: userHasPermission(user, 'admin:analytics'),
        canManageSettings: userHasPermission(user, 'admin:settings'),
        
        // Gestión de usuarios
        canViewAllUsers: userHasPermission(user, 'users:read'),
        canCreateUsers: userHasPermission(user, 'users:write'),
        canDeleteUsers: userHasPermission(user, 'users:delete'),
        canSearchEmployees: userHasPermission(user, 'users:search'),
        
        // Gestión de solicitudes  
        canViewAllRequests: userHasPermission(user, 'requests:read'),
        canViewOwnRequests: userHasPermission(user, 'requests:read_own'),
        canCreateRequests: userHasPermission(user, 'requests:write'),
        canApproveRequests: userHasPermission(user, 'requests:approve'),
        canDeleteRequests: userHasPermission(user, 'requests:delete'),
        canFilterAllRequestTypes: userHasPermission(user, 'requests:filter_all'),
        canFilterOwnRequestType: userHasPermission(user, 'requests:filter_own_type'),
        
        // Mantenimiento
        canViewMaintenanceEmployees: userHasPermission(user, 'maintenance:read'),
        canSearchMaintenanceEmployees: userHasPermission(user, 'maintenance:search'),
        canViewMaintenanceDiagnostics: userHasPermission(user, 'maintenance:diagnostic'),
        
        // Operaciones
        canViewOperationsEmployees: userHasPermission(user, 'operations:read'),
        canSearchOperationsEmployees: userHasPermission(user, 'operations:search'),
        
        // Notificaciones
        canViewNotifications: userHasPermission(user, 'notifications:read'),
        canUpdateNotifications: userHasPermission(user, 'notifications:write')
      },
      
      // Configuración de UI basada en permisos
      uiConfig: {
        showAdminNavigation: userHasPermission(user, 'admin:panel'),
        showAllRequestsView: userHasPermission(user, 'requests:read'),
        showUserManagement: userHasPermission(user, 'users:read'),
        showMaintenanceSection: userHasPermission(user, 'maintenance:read'),
        showOperationsSection: userHasPermission(user, 'operations:read'),
        
        // Filtros disponibles
        availableFilters: {
          allUserTypes: userHasPermission(user, 'requests:filter_all'),
          ownUserType: userHasPermission(user, 'requests:filter_own_type'),
          userCode: !userHasPermission(user, 'requests:read') && userHasPermission(user, 'requests:read_own')
        }
      }
    };

    logger.info({
      userCode: user.code,
      role: user.roleInfo?.name,
      permissionsCount: user.permissions.length
    }, 'Contexto de usuario proporcionado');

    return c.json({
      success: true,
      data: userContextData
    });

  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, 'Error al obtener contexto de usuario');
    
    return c.json({
      success: false,
      message: 'Error interno del servidor'
    }, 500);
  }
});

// GET /permissions - Obtener todas las capacidades específicas del usuario
userContext.get('/permissions', async (c) => {
  try {
    const user = c.get('currentUser') as UserContext;
    
    if (!user) {
      return c.json({ 
        success: false, 
        message: 'Usuario no autenticado' 
      }, 401);
    }

    return c.json({
      success: true,
      data: {
        role: user.roleInfo?.name,
        permissions: user.permissions,
        capabilities: user.permissions.reduce((acc: any, permission: string) => {
          acc[permission.replace(':', '_')] = true;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : String(error)
    }, 'Error al obtener permisos de usuario');
    
    return c.json({
      success: false,
      message: 'Error interno del servidor'
    }, 500);
  }
});

export default userContext;
