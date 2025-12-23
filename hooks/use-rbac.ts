import { useState, useEffect, useCallback, useMemo } from 'react';

// User context interface matching the backend
export interface UserContext {
  code: string;
  name: string;
  role: string;
  displayName: string;
  description: string;
  userType: string;
  permissions: string[];
  capabilities: {
    // Panel de administración
    canAccessAdminPanel: boolean;
    canViewAnalytics: boolean;
    canManageSettings: boolean;

    // Gestión de usuarios
    canViewAllUsers: boolean;
    canCreateUsers: boolean;
    canDeleteUsers: boolean;
    canSearchEmployees: boolean;

    // Gestión de solicitudes
    canViewAllRequests: boolean;
    canViewOwnRequests: boolean;
    canCreateRequests: boolean;
    canApproveRequests: boolean;
    canDeleteRequests: boolean;
    canFilterAllRequestTypes: boolean;
    canFilterOwnRequestType: boolean;

    // Mantenimiento
    canViewMaintenanceEmployees: boolean;
    canSearchMaintenanceEmployees: boolean;
    canViewMaintenanceDiagnostics: boolean;

    // Operaciones
    canViewOperationsEmployees: boolean;
    canSearchOperationsEmployees: boolean;

    // Notificaciones
    canViewNotifications: boolean;
    canUpdateNotifications: boolean;
  };
  uiConfig: {
    showAdminNavigation: boolean;
    showAllRequestsView: boolean;
    showUserManagement: boolean;
    showMaintenanceSection: boolean;
    showOperationsSection: boolean;
    availableFilters: {
      allUserTypes: boolean;
      ownUserType: boolean;
      userCode: boolean;
    };
  };
}

interface RBACState {
  userContext: UserContext | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export const useRBAC = () => {
  const [state, setState] = useState<RBACState>({
    userContext: null,
    isLoading: true,
    error: null,
    isAuthenticated: false
  });

  // Fetch user context from backend
  const fetchUserContext = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const token = localStorage.getItem('accessToken');
      console.log('RBAC DEBUG: Token check:', token ? 'Present' : 'Missing');

      if (!token) {
        console.log('RBAC DEBUG: No token, setting unauthenticated');
        setState(prev => ({
          ...prev,
          isLoading: false,
          isAuthenticated: false,
          userContext: null
        }));
        return;
      }

      console.log('RBAC DEBUG: Making request to /user-context/me with token');
      const response = await fetch('solicitud-permisos.sao6.com.co/api/user-context/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('RBAC DEBUG: Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('RBAC DEBUG: Response data:', data);

      if (data.success && data.data) {
        console.log('RBAC DEBUG: Setting authenticated state with user data');
        setState({
          userContext: data.data,
          isLoading: false,
          error: null,
          isAuthenticated: true
        });
      } else {
        console.log('RBAC DEBUG: Response missing success or data fields');
        throw new Error(data.message || 'Failed to fetch user context');
      }

    } catch (error) {
      console.error('Error fetching user context:', error);
      setState({
        userContext: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        isAuthenticated: false
      });
    }
  }, []);

  // Initialize and refresh user context
  useEffect(() => {
    console.log('RBAC DEBUG: useEffect triggered, calling fetchUserContext');
    fetchUserContext();
  }, [fetchUserContext]);

  // Listen for storage events to refresh context when token changes
  useEffect(() => {
    const handleStorageChange = (e?: StorageEvent) => {
      console.log('RBAC DEBUG: Storage event detected, checking for token changes');
      const token = localStorage.getItem('accessToken');
      if (token && !state.isAuthenticated) {
        console.log('RBAC DEBUG: Token detected but not authenticated, refreshing context');
        fetchUserContext();
      }
    };

    // Listen for storage events (including custom events from login)
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchUserContext, state.isAuthenticated]);

  // Permission checking functions
  const hasPermission = useCallback((permission: string): boolean => {
    return state.userContext?.permissions?.includes(permission) ?? false;
  }, [state.userContext?.permissions]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  }, [hasPermission]);

  // Capability checking functions
  const hasCapability = useCallback((capability: keyof UserContext['capabilities']): boolean => {
    return state.userContext?.capabilities?.[capability] ?? false;
  }, [state.userContext?.capabilities]);

  // UI configuration checking - handle nested availableFilters object
  const hasUIConfig = useCallback((config: keyof UserContext['uiConfig']): boolean => {
    if (config === 'availableFilters') {
      return Boolean(state.userContext?.uiConfig?.[config]);
    }
    return state.userContext?.uiConfig?.[config] ?? false;
  }, [state.userContext?.uiConfig]);

  // Role checking functions
  const hasRole = useCallback((role: string): boolean => {
    return state.userContext?.role === role;
  }, [state.userContext?.role]);

  const hasAnyRole = useCallback((roles: string[]): boolean => {
    return roles.includes(state.userContext?.role || '');
  }, [state.userContext?.role]);

  // User type checking
  const hasUserType = useCallback((userType: string): boolean => {
    return state.userContext?.userType === userType;
  }, [state.userContext?.userType]);

  // Get filtered data based on permissions
  const getFilteredData = useCallback(<T>(data: T[], filterType: 'requests' | 'users'): T[] => {
    if (!state.userContext) return [];

    if (filterType === 'requests') {
      // If user can read all requests, return all data
      if (hasCapability('canViewAllRequests')) {
        return data;
      }

      // If user can only read own requests, filter by user code
      if (hasCapability('canViewOwnRequests')) {
        return data.filter((item: any) => item.code === state.userContext?.code);
      }

      return [];
    }

    if (filterType === 'users') {
      // Only users with user read capability can see user data
      if (hasCapability('canViewAllUsers')) {
        return data;
      }

      return [];
    }

    return data;
  }, [state.userContext, hasCapability]);

  // Refresh user context
  const refreshContext = useCallback(() => {
    fetchUserContext();
  }, [fetchUserContext]);

  // Logout and clear context
  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userCode');
    localStorage.removeItem('userName');
    localStorage.removeItem('userData');
    setState({
      userContext: null,
      isLoading: false,
      error: null,
      isAuthenticated: false
    });
  }, []);

  // Return memoized values to prevent unnecessary re-renders
  return useMemo(() => ({
    // State
    userContext: state.userContext,
    isLoading: state.isLoading,
    error: state.error,
    isAuthenticated: state.isAuthenticated,

    // Permission checking
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Capability checking
    hasCapability,

    // UI config checking
    hasUIConfig,

    // Role checking
    hasRole,
    hasAnyRole,

    // User type checking
    hasUserType,

    // Data filtering
    getFilteredData,

    // Actions
    refreshContext,
    logout,

    // Convenience getters
    get isAdmin() {
      return hasCapability('canAccessAdminPanel');
    },

    get canManageRequests() {
      return hasCapability('canApproveRequests') || hasCapability('canDeleteRequests');
    },

    get canManageUsers() {
      return hasCapability('canViewAllUsers') || hasCapability('canCreateUsers');
    },

    get displayName() {
      return state.userContext?.displayName || state.userContext?.name || 'Usuario';
    },

    get roleDisplayName() {
      return state.userContext?.displayName || 'Usuario';
    }
  }), [
    state,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasCapability,
    hasUIConfig,
    hasRole,
    hasAnyRole,
    hasUserType,
    getFilteredData,
    refreshContext,
    logout
  ]);
};
