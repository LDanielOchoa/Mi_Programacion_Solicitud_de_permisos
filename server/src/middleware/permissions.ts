import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { User } from '../types/index.js';
import { userHasPermission, getUserPermissions, getUserRole, PermissionKey, ROLES } from '../config/permissions.js';
import logger from '../config/logger.js';

// Enhanced user context interface
export interface UserContext extends User {
  permissions: string[];
  roleInfo: {
    name: string;
    displayName: string;
    description: string;
  };
}

// Middleware to enrich user context with permissions
export const enrichUserWithPermissions = async (c: Context, next: Next) => {
  const user = c.get('currentUser') as User;
  
  if (!user) {
    await next();
    return;
  }

  // Get user role and permissions
  const roleName = getUserRole(user);
  const permissions = getUserPermissions(user);
  const role = ROLES[roleName];

  // Enrich user context
  const enrichedUser: UserContext = {
    ...user,
    permissions,
    roleInfo: {
      name: roleName,
      displayName: role?.displayName || 'Usuario',
      description: role?.description || 'Usuario del sistema'
    }
  };

  // Update context with enriched user
  c.set('currentUser', enrichedUser);
  c.set('userPermissions', permissions);
  c.set('userRole', roleName);

  logger.debug({
    userCode: user.code,
    role: roleName,
    permissions: permissions.length,
    userType: user.userType
  }, 'Usuario enriquecido con permisos');

  await next();
};

// Permission checking middleware factory
export const requirePermission = (permission: PermissionKey) => {
  return async (c: Context, next: Next) => {
    const user = c.get('currentUser') as UserContext;
    
    if (!user) {
      throw new HTTPException(401, { message: 'Autenticación requerida' });
    }

    if (!userHasPermission(user, permission)) {
      logger.warn({
        userCode: user.code,
        role: user.roleInfo?.name,
        requiredPermission: permission,
        userPermissions: user.permissions
      }, 'Acceso denegado - permisos insuficientes');
      
      throw new HTTPException(403, { 
        message: `Acceso denegado. Se requiere el permiso: ${permission}. Rol actual: ${user.roleInfo?.displayName || 'Desconocido'}`
      });
    }

    await next();
  };
};

// Multiple permissions checking (user must have ALL permissions)
export const requireAllPermissions = (permissions: PermissionKey[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get('currentUser') as UserContext;
    
    if (!user) {
      throw new HTTPException(401, { message: 'Autenticación requerida' });
    }

    const missingPermissions = permissions.filter(p => !userHasPermission(user, p));
    
    if (missingPermissions.length > 0) {
      logger.warn({
        userCode: user.code,
        role: user.roleInfo?.name,
        requiredPermissions: permissions,
        missingPermissions,
        userPermissions: user.permissions
      }, 'Acceso denegado - permisos faltantes');
      
      throw new HTTPException(403, { 
        message: `Acceso denegado. Se requieren los permisos: ${missingPermissions.join(', ')}. Rol actual: ${user.roleInfo?.displayName || 'Desconocido'}`
      });
    }

    await next();
  };
};

// At least one permission checking (user must have ANY of the permissions)
export const requireAnyPermission = (permissions: PermissionKey[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get('currentUser') as UserContext;
    
    if (!user) {
      throw new HTTPException(401, { message: 'Autenticación requerida' });
    }

    const hasAnyPermission = permissions.some(p => userHasPermission(user, p));
    
    if (!hasAnyPermission) {
      logger.warn({
        userCode: user.code,
        role: user.roleInfo?.name,
        requiredPermissions: permissions,
        userPermissions: user.permissions
      }, 'Acceso denegado - ningún permiso válido');
      
      throw new HTTPException(403, { 
        message: `Acceso denegado. Se requiere al menos uno de los permisos: ${permissions.join(', ')}. Rol actual: ${user.roleInfo?.displayName || 'Desconocido'}`
      });
    }

    await next();
  };
};

// Legacy admin middleware adapter (for backward compatibility)
export const requireAdmin = async (c: Context, next: Next) => {
  const user = c.get('currentUser') as UserContext;
  
  if (!user) {
    throw new HTTPException(401, { message: 'Autenticación requerida' });
  }
  
  // Check if user has admin panel access
  if (!userHasPermission(user, 'admin:panel')) {
    logger.warn({
      userCode: user.code,
      role: user.roleInfo?.name,
      path: c.req.url
    }, 'Intento de acceso al panel de administrador no autorizado');
    
    throw new HTTPException(403, { 
      message: `Acceso denegado. Se requieren permisos de administrador. Rol actual: ${user.roleInfo?.displayName || 'Desconocido'}`
    });
  }
  
  await next();
};

// Data filtering middleware - applies permission-based filtering to responses
export const applyDataFiltering = (filterType: 'requests' | 'users') => {
  return async (c: Context, next: Next) => {
    // Store filter type in context for use in route handlers
    c.set('dataFilterType', filterType);
    await next();
  };
};

// Helper to get filtered query parameters based on permissions
export const getFilteredQueryParams = (c: Context) => {
  const user = c.get('currentUser') as UserContext;
  const baseParams = {
    page: parseInt(c.req.query('page') || '1', 10),
    limit: parseInt(c.req.query('limit') || '20', 10),
    dateFrom: c.req.query('dateFrom'),
    dateTo: c.req.query('dateTo'),
    status: c.req.query('status'),
    type: c.req.query('type'),
    department: c.req.query('department'),
    priority: c.req.query('priority')
  };

  // Apply permission-based filtering
  const filteredParams: any = { ...baseParams };

  // If user can only see their own user type, add userType filter
  if (userHasPermission(user, 'requests:filter_own_type') && !userHasPermission(user, 'requests:filter_all')) {
    filteredParams.userType = user.userType;
  }

  // If user can only read own requests, add user code filter
  if (userHasPermission(user, 'requests:read_own') && !userHasPermission(user, 'requests:read')) {
    filteredParams.userCode = user.code;
  }

  return filteredParams;
};

// Middleware to inject user context info into responses
export const injectUserContext = async (c: Context, next: Next) => {
  await next();
  
  const user = c.get('currentUser') as UserContext;
  if (user && c.res.headers.get('content-type')?.includes('application/json')) {
    const originalResponse = await c.res.json();
    
    // Add user context to response
    const enhancedResponse = {
      ...originalResponse,
      userContext: {
        role: user.roleInfo?.name,
        displayName: user.roleInfo?.displayName,
        permissions: user.permissions,
        canAccess: {
          adminPanel: userHasPermission(user, 'admin:panel'),
          allRequests: userHasPermission(user, 'requests:read'),
          userManagement: userHasPermission(user, 'users:read'),
          maintenance: userHasPermission(user, 'maintenance:read'),
          operations: userHasPermission(user, 'operations:read')
        }
      }
    };
    
    c.res = new Response(JSON.stringify(enhancedResponse), {
      status: c.res.status,
      headers: c.res.headers
    });
  }
};
