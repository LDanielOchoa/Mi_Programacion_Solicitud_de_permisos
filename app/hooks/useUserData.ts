import { useState, useEffect, useCallback } from 'react';
import { UserData } from '../types';

interface UserCache {
  data: UserData | null;
  timestamp: number;
}

const USER_CACHE_KEY = 'userData';
const CACHE_EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutos

export default function useUserData() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    // Verificar caché primero
    const cachedUserData = localStorage.getItem(USER_CACHE_KEY);
    if (cachedUserData) {
      const parsedCache: UserCache = JSON.parse(cachedUserData);

      // Verificar si la caché está vigente
      if (Date.now() - parsedCache.timestamp < CACHE_EXPIRATION_TIME) {
        setUserData(parsedCache.data);
        setIsLoading(false);
        return parsedCache.data;
      }
    }

    // Si no hay caché válida, buscar en el servidor
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        return null;
      }

      const response = await fetch('https://solicitud-permisos.sao6.com.co/api/auth/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error (useUserData): Status ${response.status}`, errorText);
        throw new Error('Error al obtener datos del usuario');
      }

      const data: UserData = await response.json();

      // Guardar en caché
      const cacheEntry: UserCache = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(cacheEntry));

      setUserData(data);
      setIsLoading(false);
      return data;

    } catch (fetchError) {
      console.error('Error fetching user data:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Error desconocido');
      setIsLoading(false);
      return null;
    }
  }, []);

  const clearUserData = useCallback(() => {
    localStorage.removeItem(USER_CACHE_KEY);
    setUserData(null);
    setError(null);
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return {
    userData,
    isLoading,
    error,
    fetchUserData,
    clearUserData
  };
} 