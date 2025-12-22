"use client"

import React, { createContext, useContext, ReactNode } from 'react';
import { useRBAC, UserContext } from '../hooks/use-rbac';

interface RBACContextType {
  userContext: UserContext | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasCapability: (capability: keyof UserContext['capabilities']) => boolean;
  hasUIConfig: (config: keyof UserContext['uiConfig']) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasUserType: (userType: string) => boolean;
  getFilteredData: <T>(data: T[], filterType: 'requests' | 'users') => T[];
  refreshContext: () => void;
  logout: () => void;
  isAdmin: boolean;
  canManageRequests: boolean;
  canManageUsers: boolean;
  displayName: string;
  roleDisplayName: string;
}

const RBACContext = createContext<RBACContextType | null>(null);

interface RBACProviderProps {
  children: ReactNode;
}

export const RBACProvider: React.FC<RBACProviderProps> = ({ children }) => {
  const rbacData = useRBAC();

  return (
    <RBACContext.Provider value={rbacData}>
      {children}
    </RBACContext.Provider>
  );
};

export const useRBACContext = (): RBACContextType => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBACContext must be used within an RBACProvider');
  }
  return context;
};

// Higher-order component for permission-based rendering
interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  capability?: keyof UserContext['capabilities'];
  role?: string;
  roles?: string[];
  userType?: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  permissions,
  requireAll = false,
  capability,
  role,
  roles,
  userType,
  fallback = null,
  children
}) => {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    hasCapability, 
    hasRole, 
    hasAnyRole, 
    hasUserType,
    isLoading 
  } = useRBACContext();

  if (isLoading) {
    return <div className="flex items-center justify-center p-4">Cargando permisos...</div>;
  }

  let hasAccess = true;

  // Check single permission
  if (permission && !hasPermission(permission)) {
    hasAccess = false;
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    if (requireAll) {
      hasAccess = hasAllPermissions(permissions);
    } else {
      hasAccess = hasAnyPermission(permissions);
    }
  }

  // Check capability
  if (capability && !hasCapability(capability)) {
    hasAccess = false;
  }

  // Check single role
  if (role && !hasRole(role)) {
    hasAccess = false;
  }

  // Check multiple roles
  if (roles && !hasAnyRole(roles)) {
    hasAccess = false;
  }

  // Check user type
  if (userType && !hasUserType(userType)) {
    hasAccess = false;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Component for admin panel access
export const AdminGuard: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback = <div className="text-center p-4 text-red-500">Acceso denegado: Se requieren permisos de administrador</div>
}) => (
  <PermissionGuard capability="canAccessAdminPanel" fallback={fallback}>
    {children}
  </PermissionGuard>
);

// Component for request management access
export const RequestManagementGuard: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback = <div className="text-center p-4 text-red-500">Acceso denegado: Se requieren permisos de gestión de solicitudes</div>
}) => (
  <PermissionGuard 
    permissions={['requests:read', 'requests:approve', 'requests:delete']}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

// Component for user management access
export const UserManagementGuard: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback = <div className="text-center p-4 text-red-500">Acceso denegado: Se requieren permisos de gestión de usuarios</div>
}) => (
  <PermissionGuard capability="canViewAllUsers" fallback={fallback}>
    {children}
  </PermissionGuard>
);

// Hook for conditional rendering based on permissions
export const usePermissionGuard = () => {
  const rbac = useRBACContext();

  return {
    canRender: (options: Omit<PermissionGuardProps, 'children' | 'fallback'>) => {
      let hasAccess = true;

      if (options.permission && !rbac.hasPermission(options.permission)) {
        hasAccess = false;
      }

      if (options.permissions && options.permissions.length > 0) {
        if (options.requireAll) {
          hasAccess = rbac.hasAllPermissions(options.permissions);
        } else {
          hasAccess = rbac.hasAnyPermission(options.permissions);
        }
      }

      if (options.capability && !rbac.hasCapability(options.capability)) {
        hasAccess = false;
      }

      if (options.role && !rbac.hasRole(options.role)) {
        hasAccess = false;
      }

      if (options.roles && !rbac.hasAnyRole(options.roles)) {
        hasAccess = false;
      }

      if (options.userType && !rbac.hasUserType(options.userType)) {
        hasAccess = false;
      }

      return hasAccess;
    },
    ...rbac
  };
};
