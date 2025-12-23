import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDebounce } from 'use-debounce';

interface Person {
  code: string;
  name: string;
  telefone: string;
  password?: string;
  cargo?: string;
  role: 'admin' | 'employee';
  created_at?: string;
  updated_at?: string;
  avatar?: string;
  estado: 'activo' | 'inactivo';
  fechaIngreso?: string;
  direccion?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseOptimizedUserListReturn {
  people: Person[];
  loading: boolean;
  searchTerm: string;
  debouncedSearchTerm: string;
  selectedArea: string;
  pagination: PaginationInfo;
  apiError: string;
  isPageTransition: boolean;
  setSearchTerm: (term: string) => void;
  setSelectedArea: (area: string) => void;
  handlePageChange: (page: number) => void;
  clearSearch: () => void;
  clearApiError: () => void;
  refreshUsers: () => Promise<void>;
  updatePerson: (person: Person) => void;
}

interface UseOptimizedUserListOptions {
  userType?: string | null;
}

const ITEMS_PER_PAGE = 8;
const DEBOUNCE_DELAY = 300;

// Cache global para evitar requests repetidos
const requestCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutos

const getApiUrl = () => 'solicitud-permisos.sao6.com.co/api';
const getAuthToken = () => localStorage.getItem('accessToken');

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const cacheKey = `${endpoint}-${JSON.stringify(options)}`;

  // Verificar cache para requests GET
  if ((!options.method || options.method === 'GET') && requestCache.has(cacheKey)) {
    const cached = requestCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    requestCache.delete(cacheKey);
  }

  const token = getAuthToken();
  const url = `${getApiUrl()}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // Si no se puede parsear el JSON del error, usar el mensaje por defecto
      }

      // Manejar diferentes tipos de errores HTTP
      switch (response.status) {
        case 401:
          errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
          break;
        case 403:
          errorMessage = 'No tienes permisos para realizar esta acción.';
          break;
        case 404:
          errorMessage = 'Recurso no encontrado.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Intenta nuevamente más tarde.';
          break;
        case 503:
          errorMessage = 'Servicio no disponible. Intenta nuevamente más tarde.';
          break;
      }

      throw new Error(errorMessage);
    }

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error('Respuesta del servidor no válida');
    }

    // Guardar en cache para requests GET
    if (!options.method || options.method === 'GET') {
      requestCache.set(cacheKey, { data, timestamp: Date.now() });
    }

    return data;
  } catch (error) {
    // Manejar errores de red
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Error de conexión. Verifica tu conexión a internet.');
    }

    // Re-lanzar otros errores
    throw error;
  }
};

const fetchUsers = async (page: number, searchTerm: string, area: string, userType?: string | null): Promise<{ data: Person[], pagination: PaginationInfo }> => {
  try {
    console.log('🔍 fetchUsers called with userType:', userType);

    // Si es usuario de mantenimiento, usar endpoint específico
    if (userType === 'se_maintenance') {
      console.log('📋 Using maintenance endpoint for se_maintenance user');
      const response = await apiRequest('/admin/maintenance-employees');
      console.log('📋 Maintenance response:', response);

      if (!response || typeof response !== 'object') {
        throw new Error('Respuesta inválida del servidor');
      }

      let userData = Array.isArray(response.data) ? response.data : [];

      // Aplicar filtros localmente para empleados de mantenimiento
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        userData = userData.filter((user: any) =>
          user.name?.toLowerCase().includes(searchLower) ||
          user.code?.toLowerCase().includes(searchLower) ||
          user.cargo?.toLowerCase().includes(searchLower)
        );
      }

      if (area && area !== 'Todas') {
        userData = userData.filter((user: any) => user.area === area);
      }

      // Implementar paginación local
      const total = userData.length;
      const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
      const offset = (page - 1) * ITEMS_PER_PAGE;
      const paginatedData = userData.slice(offset, offset + ITEMS_PER_PAGE);

      return {
        data: paginatedData.map((user: any) => ({
          code: user.code || '',
          name: user.name || '',
          telefone: user.telefone || '',
          password: user.password || '',
          cargo: user.cargo || '',
          role: user.role === 'admin' ? 'admin' : 'employee',
          created_at: user.created_at,
          updated_at: user.updated_at,
          avatar: user.avatar || '',
          estado: user.estado || 'activo',
          fechaIngreso: user.fechaIngreso,
          direccion: user.direccion || '',
          area: user.area || '',
          email: user.email || '',
          ...user
        })),
        pagination: {
          page: Math.max(1, Math.min(page, totalPages)),
          limit: ITEMS_PER_PAGE,
          total,
          totalPages: Math.max(1, totalPages)
        }
      };
    } else {
      // Usuario normal - usar endpoint original
      const params = new URLSearchParams({
        page: String(page),
        limit: String(ITEMS_PER_PAGE),
        search: searchTerm || '',
        area: area === 'Todas' ? '' : area,
      });

      const response = await apiRequest(`/users/user/lists?${params.toString()}`);

      // Validar que la respuesta tenga la estructura esperada
      if (!response || typeof response !== 'object') {
        throw new Error('Respuesta inválida del servidor');
      }

      // Asegurar que data sea un array
      const userData = Array.isArray(response.data) ? response.data : [];

      // Validar y normalizar la paginación
      const paginationData = {
        page: Math.max(1, parseInt(response.page) || page),
        limit: Math.max(1, parseInt(response.limit) || ITEMS_PER_PAGE),
        total: Math.max(0, parseInt(response.total) || 0),
        totalPages: Math.max(1, parseInt(response.totalPages) || 1),
      };

      return {
        data: userData.map((user: any) => ({
          code: user.code || '',
          name: user.name || '',
          telefone: user.telefone || '',
          password: user.password || '',
          cargo: user.cargo || '',
          role: user.role === 'admin' ? 'admin' : 'employee',
          created_at: user.created_at,
          updated_at: user.updated_at,
          avatar: user.avatar || '',
          estado: 'activo' as const,
          fechaIngreso: user.fechaIngreso,
          direccion: user.direccion,
          area: user.area,
          email: user.email,
          ...user
        })),
        pagination: paginationData
      };
    }
  } catch (error) {
    console.error('Error en fetchUsers:', error);
    // Retornar datos por defecto en caso de error
    return {
      data: [],
      pagination: {
        page: Math.max(1, page),
        limit: ITEMS_PER_PAGE,
        total: 0,
        totalPages: 1,
      }
    };
  }
};

export const useOptimizedUserList = (options?: UseOptimizedUserListOptions): UseOptimizedUserListReturn => {
  const { userType } = options || {};
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('Todas');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 1,
  });
  const [apiError, setApiError] = useState('');
  const [isPageTransition, setIsPageTransition] = useState(false);

  const [debouncedSearchTerm] = useDebounce(searchTerm, DEBOUNCE_DELAY);

  // Función optimizada para cargar usuarios
  const loadUsers = useCallback(async (page: number, search: string, area: string, isPageChange = false) => {
    // Validar parámetros de entrada
    const validPage = Math.max(1, Math.floor(page) || 1);
    const validSearch = typeof search === 'string' ? search.trim() : '';
    const validArea = typeof area === 'string' ? area : 'Todas';

    try {
      // Usar diferentes estados de carga según el tipo de operación
      if (isPageChange) {
        setIsPageTransition(true);
      } else {
        setLoading(true);
      }
      setApiError('');

      const { data, pagination: newPagination } = await fetchUsers(validPage, validSearch, validArea, userType);

      // Validar que los datos recibidos sean válidos
      if (!Array.isArray(data)) {
        throw new Error('Datos de usuarios inválidos recibidos del servidor');
      }

      // Validar paginación
      if (!newPagination || typeof newPagination !== 'object') {
        throw new Error('Información de paginación inválida');
      }

      setPeople(data);

      // Validar y corregir la paginación si es necesaria
      const validatedPagination = {
        page: Math.max(1, Math.min(newPagination.page || 1, newPagination.totalPages || 1)),
        limit: Math.max(1, newPagination.limit || ITEMS_PER_PAGE),
        total: Math.max(0, newPagination.total || 0),
        totalPages: Math.max(1, newPagination.totalPages || 1)
      };

      // Si la página actual es mayor que el total de páginas, ajustar
      if (validatedPagination.page > validatedPagination.totalPages && validatedPagination.totalPages > 0) {
        validatedPagination.page = validatedPagination.totalPages;
        // Recargar con la página corregida
        setTimeout(() => loadUsers(validatedPagination.page, validSearch, validArea, isPageChange), 100);
        return;
      }

      setPagination(validatedPagination);

    } catch (error) {
      console.error('Error loading users:', error);

      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al cargar usuarios';
      setApiError(errorMessage);

      // En caso de error, mantener un estado de paginación válido pero vacío
      setPeople([]);
      setPagination(prev => ({
        page: Math.max(1, validPage),
        limit: ITEMS_PER_PAGE,
        total: 0,
        totalPages: 1
      }));
    } finally {
      setLoading(false);
      setIsPageTransition(false);
    }
  }, []);

  // Handlers optimizados
  const handlePageChange = useCallback((newPage: number) => {
    // Validar que la nueva página esté en el rango válido
    if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== pagination.page) {
      // Actualizar inmediatamente la página para evitar flickering
      setPagination(prev => ({ ...prev, page: newPage }));
      // Cargar los datos de la nueva página
      loadUsers(newPage, debouncedSearchTerm, selectedArea, true);
    }
  }, [pagination.totalPages, pagination.page, loadUsers, debouncedSearchTerm, selectedArea]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setSelectedArea('Todas');
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const clearApiError = useCallback(() => {
    setApiError('');
  }, []);

  const refreshUsers = useCallback(async (retryCount = 0) => {
    const maxRetries = 3;

    try {
      // Limpiar cache antes de refrescar
      requestCache.clear();
      await loadUsers(pagination.page, debouncedSearchTerm, selectedArea);
    } catch (error) {
      if (retryCount < maxRetries) {
        console.log(`Reintentando carga de usuarios (${retryCount + 1}/${maxRetries})...`);
        // Esperar un poco antes de reintentar (backoff exponencial)
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => refreshUsers(retryCount + 1), delay);
      } else {
        console.error('Error después de múltiples intentos:', error);
        setApiError('Error persistente al cargar usuarios. Verifica tu conexión.');
      }
    }
  }, [loadUsers, pagination.page, debouncedSearchTerm, selectedArea]);

  const updatePerson = useCallback((updatedPerson: Person) => {
    setPeople(prev => prev.map(p => p.code === updatedPerson.code ? updatedPerson : p));
  }, []);

  // Effects optimizados
  useEffect(() => {
    // Solo cargar si tenemos valores válidos y no estamos en una transición de página
    if (pagination.page >= 1 && typeof debouncedSearchTerm === 'string' && typeof selectedArea === 'string' && !isPageTransition) {
      loadUsers(pagination.page, debouncedSearchTerm, selectedArea, false);
    }
  }, [loadUsers, pagination.page, debouncedSearchTerm, selectedArea, isPageTransition]);

  // Reset page when search term or area changes (sin incluir pagination.page en dependencias)
  useEffect(() => {
    // Solo resetear si realmente cambió algo significativo
    setPagination(prev => {
      if (prev.page !== 1) {
        return { ...prev, page: 1 };
      }
      return prev;
    });
  }, [debouncedSearchTerm, selectedArea]);

  // Cleanup effect para limpiar timers y requests pendientes
  useEffect(() => {
    return () => {
      // Limpiar cache viejo al desmontar
      const now = Date.now();
      for (const [key, value] of requestCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
          requestCache.delete(key);
        }
      }
    };
  }, []);

  // Memoizar valores que no cambian frecuentemente
  const memoizedReturn = useMemo(() => ({
    people,
    loading,
    searchTerm,
    debouncedSearchTerm,
    selectedArea,
    pagination,
    apiError,
    isPageTransition,
    setSearchTerm,
    setSelectedArea,
    handlePageChange,
    clearSearch,
    clearApiError,
    refreshUsers,
    updatePerson,
  }), [
    people,
    loading,
    searchTerm,
    debouncedSearchTerm,
    selectedArea,
    pagination,
    apiError,
    isPageTransition,
    handlePageChange,
    clearSearch,
    clearApiError,
    refreshUsers,
    updatePerson,
  ]);

  return memoizedReturn;
};