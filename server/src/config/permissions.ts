// Permission Matrix and RBAC Configuration
export interface Permission {
  resource: string;
  action: string;
  description: string;
}

export interface Role {
  name: string;
  displayName: string;
  permissions: string[];
  description: string;
}

// Define all available permissions
export const PERMISSIONS = {
  // User Management
  'users:read': { resource: 'users', action: 'read', description: 'View user list and details' },
  'users:write': { resource: 'users', action: 'write', description: 'Create and edit users' },
  'users:delete': { resource: 'users', action: 'delete', description: 'Delete users' },
  'users:search': { resource: 'users', action: 'search', description: 'Search employees in SE database' },
  
  // Request Management
  'requests:read': { resource: 'requests', action: 'read', description: 'View all requests' },
  'requests:read_own': { resource: 'requests', action: 'read_own', description: 'View own requests only' },
  'requests:write': { resource: 'requests', action: 'write', description: 'Create requests' },
  'requests:approve': { resource: 'requests', action: 'approve', description: 'Approve/reject requests' },
  'requests:delete': { resource: 'requests', action: 'delete', description: 'Delete requests' },
  'requests:filter_all': { resource: 'requests', action: 'filter_all', description: 'See all user types in filters' },
  'requests:filter_own_type': { resource: 'requests', action: 'filter_own_type', description: 'See only own user type requests' },
  
  // Maintenance Operations
  'maintenance:read': { resource: 'maintenance', action: 'read', description: 'View maintenance employees' },
  'maintenance:search': { resource: 'maintenance', action: 'search', description: 'Search maintenance employees' },
  'maintenance:diagnostic': { resource: 'maintenance', action: 'diagnostic', description: 'View maintenance diagnostics' },
  
  // Operations Management
  'operations:read': { resource: 'operations', action: 'read', description: 'View operations employees' },
  'operations:search': { resource: 'operations', action: 'search', description: 'Search operations employees' },
  
  // Admin Panel Access
  'admin:panel': { resource: 'admin', action: 'panel', description: 'Access admin panel' },
  'admin:analytics': { resource: 'admin', action: 'analytics', description: 'View admin analytics' },
  'admin:settings': { resource: 'admin', action: 'settings', description: 'Manage system settings' },
  
  // Notifications
  'notifications:read': { resource: 'notifications', action: 'read', description: 'View notifications' },
  'notifications:write': { resource: 'notifications', action: 'write', description: 'Update notification status' },
} as const;

// Define roles with their permissions
export const ROLES: Record<string, Role> = {
  super_admin: {
    name: 'super_admin',
    displayName: 'Super Administrador',
    description: 'Acceso completo a todo el sistema',
    permissions: Object.keys(PERMISSIONS)
  },
  
  admin: {
    name: 'admin',
    displayName: 'Administrador',
    description: 'Administrador general con acceso a la mayoría de funciones',
    permissions: [
      'users:read', 'users:search',
      'requests:read', 'requests:approve', 'requests:filter_all',
      'maintenance:read', 'maintenance:search', 'maintenance:diagnostic',
      'operations:read', 'operations:search',
      'admin:panel', 'admin:analytics',
      'notifications:read', 'notifications:write'
    ]
  },
  
  maintenance_supervisor: {
    name: 'maintenance_supervisor',
    displayName: 'Supervisor de Mantenimiento',
    description: 'Supervisor con permisos de mantenimiento y aprobación',
    permissions: [
      'users:read', 'users:search',
      'requests:read', 'requests:approve', 'requests:filter_own_type',
      'maintenance:read', 'maintenance:search', 'maintenance:diagnostic',
      'admin:panel',
      'notifications:read', 'notifications:write'
    ]
  },
  
  operations_supervisor: {
    name: 'operations_supervisor', 
    displayName: 'Supervisor de Operaciones',
    description: 'Supervisor con permisos de operaciones y aprobación',
    permissions: [
      'users:read', 'users:search',
      'requests:read', 'requests:approve', 'requests:filter_own_type', 
      'operations:read', 'operations:search',
      'admin:panel',
      'notifications:read', 'notifications:write'
    ]
  },
  
  maintenance_employee: {
    name: 'maintenance_employee',
    displayName: 'Empleado de Mantenimiento',
    description: 'Empleado de mantenimiento con permisos básicos',
    permissions: [
      'requests:read_own', 'requests:write',
      'notifications:read'
    ]
  },
  
  operations_employee: {
    name: 'operations_employee',
    displayName: 'Empleado de Operaciones', 
    description: 'Empleado de operaciones con permisos básicos',
    permissions: [
      'requests:read_own', 'requests:write',
      'notifications:read'
    ]
  },
  
  registered_user: {
    name: 'registered_user',
    displayName: 'Usuario Registrado',
    description: 'Usuario regular del sistema',
    permissions: [
      'requests:read_own', 'requests:write',
      'notifications:read'
    ]
  }
};

// User type to role mapping
export const USER_TYPE_TO_ROLE: Record<string, string> = {
  'se_maintenance': 'maintenance_employee',
  'se_operations': 'operations_employee', 
  'registered': 'registered_user'
};

// Helper function to get user role
export function getUserRole(user: { role?: string, userType?: string }): string {
  // If user has explicit role, use it
  if (user.role && ROLES[user.role]) {
    return user.role;
  }
  
  // Otherwise map from userType
  if (user.userType && USER_TYPE_TO_ROLE[user.userType]) {
    return USER_TYPE_TO_ROLE[user.userType];
  }
  
  // Default to registered user
  return 'registered_user';
}

// Helper function to check if user has permission
export function userHasPermission(user: { role?: string, userType?: string }, permission: string): boolean {
  const userRole = getUserRole(user);
  const role = ROLES[userRole];
  
  if (!role) {
    return false;
  }
  
  return role.permissions.includes(permission);
}

// Helper function to get all permissions for a user
export function getUserPermissions(user: { role?: string, userType?: string }): string[] {
  const userRole = getUserRole(user);
  const role = ROLES[userRole];
  
  return role ? role.permissions : [];
}

// Filter data based on user permissions
export function filterDataByPermissions<T>(
  data: T[],
  user: { role?: string, userType?: string, code?: string },
  filterType: 'requests' | 'users'
): T[] {
  
  if (filterType === 'requests') {
    // If user can read all requests, return all
    if (userHasPermission(user, 'requests:read')) {
      return data;
    }
    
    // If user can only read own requests, filter by user code
    if (userHasPermission(user, 'requests:read_own') && user.code) {
      return data.filter((item: any) => item.code === user.code);
    }
    
    return [];
  }
  
  if (filterType === 'users') {
    // Only users with user read permission can see user data
    if (userHasPermission(user, 'users:read')) {
      return data;
    }
    
    return [];
  }
  
  return data;
}

export type PermissionKey = keyof typeof PERMISSIONS;

// Export UserContext interface
export interface UserContext {
  code: string;
  name: string;
  role?: string;
  userType?: string;
  permissions: string[];
  roleInfo: {
    name: string;
    displayName: string;
    description: string;
  };
}
