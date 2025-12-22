'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSimpleCache } from '@/lib/simple-cache';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface SimpleApiOptions {
  enabled?: boolean;
  cacheTime?: number;
}

export function useSimpleApi<T = any>(
  url: string | null,
  options: SimpleApiOptions = {}
) {
  const { enabled = true, cacheTime = 5 * 60 * 1000 } = options;
  const cache = getSimpleCache();
  
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchData = useCallback(async (url: string, useCache = true) => {
    // Verificar cache primero
    if (useCache) {
      try {
        const cachedData = await cache.get<T>(`api:${url}`);
        if (cachedData !== null) {
          setState({
            data: cachedData,
            loading: false,
            error: null,
          });
          return;
        }
      } catch (error) {
        console.warn('Cache error:', error);
      }
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Guardar en cache
      try {
        await cache.set(`api:${url}`, data, cacheTime);
      } catch (error) {
        console.warn('Cache save error:', error);
      }

      setState({
        data,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      setState({
        data: null,
        loading: false,
        error: error.message || 'Error desconocido',
      });
    }
  }, [cache, cacheTime]);

  const refetch = useCallback(() => {
    if (!url) return;
    fetchData(url, false); // Sin cache en refetch
  }, [url, fetchData]);

  useEffect(() => {
    if (!url || !enabled) return;
    fetchData(url);
  }, [url, enabled, fetchData]);

  return {
    ...state,
    refetch,
  };
}

// Hook para mutaciones
export function useSimpleMutation<TData = any, TVariables = any>() {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
  }>({
    loading: false,
    error: null,
  });

  const mutate = useCallback(async (
    url: string,
    variables: TVariables,
    method: 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'POST'
  ): Promise<TData> => {
    setState({ loading: true, error: null });

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
      setState({ loading: false, error: null });
      
      return data;
    } catch (error: any) {
      setState({ loading: false, error: error.message });
      throw error;
    }
  }, []);

  return {
    ...state,
    mutate,
  };
}

export default useSimpleApi; 