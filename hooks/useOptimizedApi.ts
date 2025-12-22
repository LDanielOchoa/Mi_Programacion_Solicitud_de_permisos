'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useCache } from '@/lib/cache-manager';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

interface ApiOptions {
  cacheTime?: number; // Tiempo de cache en ms
  staleTime?: number; // Tiempo antes de considerar datos obsoletos
  retryCount?: number; // Número de reintentos
  retryDelay?: number; // Delay entre reintentos
  debounceMs?: number; // Debounce para búsquedas
  enabled?: boolean; // Si la consulta está habilitada
  refetchOnFocus?: boolean; // Refetch cuando la ventana recupera el foco
  refetchInterval?: number; // Intervalo de refetch automático
}

interface ApiResponse<T> extends ApiState<T> {
  refetch: () => Promise<void>;
  invalidate: () => void;
  setData: (data: T) => void;
}

const DEFAULT_OPTIONS: Required<ApiOptions> = {
  cacheTime: 5 * 60 * 1000, // 5 minutos
  staleTime: 30 * 1000, // 30 segundos
  retryCount: 3,
  retryDelay: 1000,
  debounceMs: 300,
  enabled: true,
  refetchOnFocus: true,
  refetchInterval: 0,
};

// Queue para batch requests
interface BatchRequest {
  url: string;
  options?: RequestInit;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

class RequestBatcher {
  private queue: BatchRequest[] = [];
  private timer: NodeJS.Timeout | null = null;
  private readonly batchDelay = 50; // 50ms para agrupar requests

  addRequest(url: string, options?: RequestInit): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ url, options, resolve, reject });
      
      if (this.timer) {
        clearTimeout(this.timer);
      }
      
      this.timer = setTimeout(() => {
        this.processBatch();
      }, this.batchDelay);
    });
  }

  private async processBatch() {
    if (this.queue.length === 0) return;
    
    const currentBatch = [...this.queue];
    this.queue = [];
    
    // Agrupar requests similares
    const grouped = this.groupSimilarRequests(currentBatch);
    
    // Procesar cada grupo
    await Promise.all(
      Object.values(grouped).map(async (requests) => {
        try {
          // Si hay múltiples requests iguales, solo hacer uno
          const firstRequest = requests[0];
          const response = await fetch(firstRequest.url, firstRequest.options);
          const data = await response.json();
          
          // Resolver todos los requests con el mismo resultado
          requests.forEach(req => req.resolve(data));
        } catch (error) {
          // Rechazar todos los requests con el mismo error
          requests.forEach(req => req.reject(error));
        }
      })
    );
  }

  private groupSimilarRequests(requests: BatchRequest[]): Record<string, BatchRequest[]> {
    return requests.reduce((groups, request) => {
      const key = `${request.url}:${JSON.stringify(request.options)}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(request);
      return groups;
    }, {} as Record<string, BatchRequest[]>);
  }
}

const requestBatcher = new RequestBatcher();

// Hook principal para APIs optimizadas
export function useOptimizedApi<T = any>(
  url: string | null,
  options: ApiOptions = {}
): ApiResponse<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const cache = useCache();
  
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    lastFetched: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const refetchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generar cache key
  const getCacheKey = useCallback((url: string) => {
    return `api:${url}`;
  }, []);

  // Función para hacer fetch con reintentos
  const fetchWithRetry = useCallback(async (
    url: string, 
    attempt: number = 1
  ): Promise<T> => {
    try {
      // Cancelar request anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      
      // Usar el batcher para requests similares
      const response = await requestBatcher.addRequest(url, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw error;
      }

      if (attempt <= opts.retryCount) {
        await new Promise(resolve => 
          setTimeout(resolve, opts.retryDelay * Math.pow(2, attempt - 1))
        );
        return fetchWithRetry(url, attempt + 1);
      }
      
      throw error;
    }
  }, [opts.retryCount, opts.retryDelay]);

  // Función principal de fetch
  const fetchData = useCallback(async (
    url: string, 
    bypassCache: boolean = false
  ): Promise<void> => {
    const cacheKey = getCacheKey(url);
    
    // Verificar cache si no se está bypassing
    if (!bypassCache) {
      const cachedData = await cache.get<T>(cacheKey);
      if (cachedData !== null) {
        setState(prev => ({
          ...prev,
          data: cachedData,
          loading: false,
          error: null,
        }));
        return;
      }
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await fetchWithRetry(url);
      
      // Guardar en cache
      await cache.set(cacheKey, data, opts.cacheTime, 2); // Prioridad alta para APIs
      
      setState({
        data,
        loading: false,
        error: null,
        lastFetched: Date.now(),
      });
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Error desconocido',
        }));
      }
    }
  }, [cache, getCacheKey, fetchWithRetry, opts.cacheTime]);

  // Función de refetch con debounce
  const debouncedFetch = useCallback((url: string, bypassCache = false) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchData(url, bypassCache);
    }, opts.debounceMs);
  }, [fetchData, opts.debounceMs]);

  // Función de refetch pública
  const refetch = useCallback(async (): Promise<void> => {
    if (!url) return;
    await fetchData(url, true); // Bypass cache en refetch manual
  }, [url, fetchData]);

  // Función para invalidar cache
  const invalidate = useCallback((): void => {
    if (!url) return;
    const cacheKey = getCacheKey(url);
    cache.invalidate(cacheKey);
  }, [url, cache, getCacheKey]);

  // Función para setear datos manualmente
  const setData = useCallback((data: T): void => {
    setState(prev => ({
      ...prev,
      data,
      lastFetched: Date.now(),
    }));
    
    if (url) {
      const cacheKey = getCacheKey(url);
      cache.set(cacheKey, data, opts.cacheTime, 2);
    }
  }, [url, cache, getCacheKey, opts.cacheTime]);

  // Efecto principal para fetch inicial
  useEffect(() => {
    if (!url || !opts.enabled) return;

    // Verificar si los datos están obsoletos
    const isStale = state.lastFetched 
      ? Date.now() - state.lastFetched > opts.staleTime 
      : true;

    if (isStale) {
      debouncedFetch(url);
    }
  }, [url, opts.enabled, debouncedFetch, opts.staleTime, state.lastFetched]);

  // Efecto para refetch en focus
  useEffect(() => {
    if (!opts.refetchOnFocus || !url) return;

    const handleFocus = () => {
      const isStale = state.lastFetched 
        ? Date.now() - state.lastFetched > opts.staleTime 
        : true;
      
      if (isStale) {
        fetchData(url);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [opts.refetchOnFocus, url, fetchData, opts.staleTime, state.lastFetched]);

  // Efecto para refetch por intervalo
  useEffect(() => {
    if (!opts.refetchInterval || opts.refetchInterval <= 0 || !url) return;

    refetchIntervalRef.current = setInterval(() => {
      fetchData(url);
    }, opts.refetchInterval);

    return () => {
      if (refetchIntervalRef.current) {
        clearInterval(refetchIntervalRef.current);
      }
    };
  }, [opts.refetchInterval, url, fetchData]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (refetchIntervalRef.current) {
        clearInterval(refetchIntervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    refetch,
    invalidate,
    setData,
  };
}

// Hook específico para mutaciones (POST, PUT, DELETE)
export function useOptimizedMutation<TData = any, TVariables = any>() {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
  }>({
    loading: false,
    error: null,
  });

  const cache = useCache();

  const mutate = useCallback(async (
    url: string,
    variables: TVariables,
    options: {
      method?: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      invalidatePattern?: string;
      optimisticUpdate?: (variables: TVariables) => void;
      onSuccess?: (data: TData) => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<TData> => {
    const { 
      method = 'POST', 
      invalidatePattern, 
      optimisticUpdate,
      onSuccess,
      onError 
    } = options;

    setState({ loading: true, error: null });

    // Optimistic update si se proporciona
    if (optimisticUpdate) {
      optimisticUpdate(variables);
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(variables),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Invalidar cache relacionado
      if (invalidatePattern) {
        cache.invalidate(invalidatePattern);
      }

      setState({ loading: false, error: null });
      
      if (onSuccess) {
        onSuccess(data);
      }

      return data;
    } catch (error: any) {
      setState({ loading: false, error: error.message });
      
      if (onError) {
        onError(error);
      }
      
      throw error;
    }
  }, [cache]);

  return {
    ...state,
    mutate,
  };
}

// Hook para paginación optimizada
export function useOptimizedPagination<T = any>(
  baseUrl: string,
  pageSize: number = 20,
  options: ApiOptions = {}
) {
  const [page, setPage] = useState(1);
  const [allData, setAllData] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const url = `${baseUrl}?page=${page}&limit=${pageSize}`;
  const { data, loading, error, refetch } = useOptimizedApi<{
    items: T[];
    hasMore: boolean;
    total: number;
  }>(url, options);

  useEffect(() => {
    if (data) {
      if (page === 1) {
        setAllData(data.items);
      } else {
        setAllData(prev => [...prev, ...data.items]);
      }
      setHasMore(data.hasMore);
    }
  }, [data, page]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [loading, hasMore]);

  const reset = useCallback(() => {
    setPage(1);
    setAllData([]);
    setHasMore(true);
  }, []);

  return {
    data: allData,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
    refetch,
    currentPage: page,
  };
}

export default useOptimizedApi; 