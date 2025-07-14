'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface SubmitOptions {
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  deduplicationWindow?: number;
  onProgress?: (stage: string) => void;
  onConnectionIssue?: (issue: string) => void;
}

interface SubmitState {
  isSubmitting: boolean;
  isRetrying: boolean;
  retryCount: number;
  stage: string;
  requestId: string | null;
  lastSubmitTime: number;
  connectionQuality: 'good' | 'slow' | 'poor' | 'offline';
}

interface PendingRequest {
  id: string;
  data: any;
  timestamp: number;
  promise: Promise<any>;
  abortController: AbortController;
}

export function useConnectionAwareSubmit<T = any>(
  submitFunction: (data: T, signal: AbortSignal) => Promise<any>,
  options: SubmitOptions = {}
) {
  const {
    timeout = 30000, // 30 segundos
    maxRetries = 2,
    retryDelay = 2000,
    deduplicationWindow = 5000, // 5 segundos para deduplicación
    onProgress,
    onConnectionIssue
  } = options;

  const [state, setState] = useState<SubmitState>({
    isSubmitting: false,
    isRetrying: false,
    retryCount: 0,
    stage: 'idle',
    requestId: null,
    lastSubmitTime: 0,
    connectionQuality: 'good'
  });

  // Tracking de requests pendientes para deduplicación
  const pendingRequests = useRef<Map<string, PendingRequest>>(new Map());
  const lastSubmissionHash = useRef<string>('');
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generar hash único para los datos
  const generateDataHash = useCallback((data: T): string => {
    return btoa(JSON.stringify(data)).replace(/[/+=]/g, '').substring(0, 16);
  }, []);

  // Generar ID único para la request
  const generateRequestId = useCallback((): string => {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Detectar calidad de conexión
  const detectConnectionQuality = useCallback(() => {
    // @ts-ignore - Navigator.connection puede no estar disponible en todos los navegadores
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (!navigator.onLine) {
      return 'offline';
    }
    
    if (connection) {
      const effectiveType = connection.effectiveType;
      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
          return 'poor';
        case '3g':
          return 'slow';
        case '4g':
        default:
          return 'good';
      }
    }
    
    return 'good';
  }, []);

  // Limpiar requests antiguos
  const cleanupOldRequests = useCallback(() => {
    const now = Date.now();
    const expiredRequests: string[] = [];

    pendingRequests.current.forEach((request, id) => {
      if (now - request.timestamp > deduplicationWindow) {
        request.abortController.abort();
        expiredRequests.push(id);
      }
    });

    expiredRequests.forEach(id => {
      pendingRequests.current.delete(id);
    });
  }, [deduplicationWindow]);

  // Función principal de envío con protección contra duplicados
  const submit = useCallback(async (data: T): Promise<any> => {
    const now = Date.now();
    const dataHash = generateDataHash(data);
    const connectionQuality = detectConnectionQuality();

    console.log('🔍 Intentando envío con protección contra duplicados...');
    console.log('📊 Estado de conexión:', connectionQuality);
    console.log('📦 Hash de datos:', dataHash);

    // 1. Verificar si es un envío duplicado reciente
    if (dataHash === lastSubmissionHash.current && 
        now - state.lastSubmitTime < deduplicationWindow) {
      console.warn('⚠️ ENVÍO DUPLICADO DETECTADO - Ignorando');
      onConnectionIssueRef.current?.('Envío duplicado detectado - solicitud ignorada');
      return Promise.reject(new Error('Envío duplicado detectado'));
    }

    // 2. Verificar si ya hay una request idéntica en progreso
    const existingRequest = Array.from(pendingRequests.current.values())
      .find(req => generateDataHash(req.data) === dataHash);

    if (existingRequest) {
      console.warn('⚠️ REQUEST IDÉNTICA EN PROGRESO - Usando request existente');
      onConnectionIssueRef.current?.('Solicitud idéntica ya en progreso');
      return existingRequest.promise;
    }

    // 3. Limpiar requests antiguos
    cleanupOldRequests();

    // 4. Verificar estado de conexión
    if (connectionQuality === 'offline') {
      console.error('❌ SIN CONEXIÓN - Abortando envío');
      onConnectionIssueRef.current?.('Sin conexión a internet');
      return Promise.reject(new Error('Sin conexión a internet'));
    }

    // 5. Verificar rate limiting más estricto para conexiones lentas
    const minDelay = connectionQuality === 'poor' ? 10000 : 
                    connectionQuality === 'slow' ? 5000 : 3000;
    
    if (now - state.lastSubmitTime < minDelay) {
      const waitTime = minDelay - (now - state.lastSubmitTime);
      console.warn(`⚠️ RATE LIMIT - Debe esperar ${Math.ceil(waitTime/1000)} segundos más`);
      onConnectionIssueRef.current?.(`Debe esperar ${Math.ceil(waitTime/1000)} segundos antes de enviar otra solicitud`);
      return Promise.reject(new Error(`Debe esperar ${Math.ceil(waitTime/1000)} segundos`));
    }

    // 6. Crear nueva request con protecciones
    const requestId = generateRequestId();
    const abortController = new AbortController();
    
    // Timeout más largo para conexiones pobres
    const adjustedTimeout = connectionQuality === 'poor' ? timeout * 2 :
                           connectionQuality === 'slow' ? timeout * 1.5 : timeout;

    setState(prevState => ({
      ...prevState,
      isSubmitting: true,
      isRetrying: false,
      retryCount: 0,
      stage: 'preparing',
      requestId,
      lastSubmitTime: now,
      connectionQuality
    }));

    onProgressRef.current?.('Preparando envío...');

    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, adjustedTimeout);

    // Crear promise de envío con retry logic
    const submitPromise = new Promise<any>(async (resolve, reject) => {
      let retryCount = 0;
      
      const attemptSubmit = async (): Promise<any> => {
        try {
          setState(prevState => ({
            ...prevState,
            stage: retryCount > 0 ? `Reintentando (${retryCount}/${maxRetries})` : 'Enviando...',
            isRetrying: retryCount > 0,
            retryCount
          }));

          onProgressRef.current?.(retryCount > 0 ? `Reintentando envío (${retryCount}/${maxRetries})...` : 'Enviando solicitud...');

          console.log(`📤 Intento de envío ${retryCount + 1}/${maxRetries + 1}`);
          
          const result = await submitFunction(data, abortController.signal);
          
          console.log('✅ Envío exitoso:', result);
          clearTimeout(timeoutId);
          
          // Marcar como exitoso
          lastSubmissionHash.current = dataHash;
          
          setState(prevState => ({
            ...prevState,
            isSubmitting: false,
            isRetrying: false,
            stage: 'success'
          }));

          onProgressRef.current?.('Enviado exitosamente');
          resolve(result);
          
        } catch (error: any) {
          console.error(`❌ Error en intento ${retryCount + 1}:`, error);
          
          // Verificar si fue abortado por timeout
          if (abortController.signal.aborted) {
            console.error('⏰ Request abortada por timeout');
            onConnectionIssueRef.current?.('Timeout - conexión muy lenta');
            reject(new Error('Timeout - la conexión es muy lenta'));
            return;
          }

          // Verificar si es un error de red que puede reintentarse
          const isRetriableError = error.name === 'NetworkError' || 
                                  error.message?.includes('fetch') ||
                                  error.message?.includes('network') ||
                                  (error.status >= 500 && error.status < 600);

          if (isRetriableError && retryCount < maxRetries) {
            retryCount++;
            console.warn(`🔄 Reintentando en ${retryDelay}ms (intento ${retryCount}/${maxRetries})`);
            onConnectionIssueRef.current?.(`Error de conexión - reintentando (${retryCount}/${maxRetries})`);
            
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return attemptSubmit();
          } else {
            console.error('❌ Envío fallido definitivamente:', error);
            clearTimeout(timeoutId);
            
            setState(prevState => ({
              ...prevState,
              isSubmitting: false,
              isRetrying: false,
              stage: 'error'
            }));

            onConnectionIssueRef.current?.('Error al enviar solicitud');
            reject(error);
          }
        }
      };

      return attemptSubmit();
    });

    // Registrar la request pendiente
    pendingRequests.current.set(requestId, {
      id: requestId,
      data,
      timestamp: now,
      promise: submitPromise,
      abortController
    });

    // Limpiar cuando termine
    submitPromise.finally(() => {
      pendingRequests.current.delete(requestId);
      clearTimeout(timeoutId);
    });

    return submitPromise;

  }, [
    generateDataHash, 
    detectConnectionQuality, 
    cleanupOldRequests, 
    generateRequestId, 
    timeout, 
    maxRetries, 
    retryDelay, 
    deduplicationWindow,
    submitFunction
  ]);

  // Cancelar todas las requests pendientes (función estable)
  const cancelAllRequestsRef = useRef<() => void>();
  
  cancelAllRequestsRef.current = () => {
    console.log('🛑 Cancelando todas las requests pendientes');
    pendingRequests.current.forEach(request => {
      request.abortController.abort();
    });
    pendingRequests.current.clear();
    
    setState(prevState => ({
      ...prevState,
      isSubmitting: false,
      isRetrying: false,
      stage: 'cancelled'
    }));
  };

  const cancelAllRequests = useCallback(() => {
    cancelAllRequestsRef.current?.();
  }, []);

  // Referencias a las funciones de callback para evitar dependencias
  const onConnectionIssueRef = useRef(onConnectionIssue);
  const onProgressRef = useRef(onProgress);
  
  onConnectionIssueRef.current = onConnectionIssue;
  onProgressRef.current = onProgress;

  // Verificar estado de conexión periódicamente
  useEffect(() => {
    const checkConnection = () => {
      const quality = detectConnectionQuality();
      setState(prevState => ({
        ...prevState,
        connectionQuality: quality
      }));
    };

    const handleOnline = () => {
      console.log('🌐 Conexión restaurada');
      checkConnection();
    };

    const handleOffline = () => {
      console.log('📱 Conexión perdida');
      onConnectionIssueRef.current?.('Conexión perdida');
      setState(prevState => ({
        ...prevState,
        connectionQuality: 'offline'
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check inicial
    checkConnection();

    // Cleanup periódico
    const cleanupInterval = setInterval(() => {
      cleanupOldRequests();
    }, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(cleanupInterval);
      // Usar la referencia directa para evitar dependencias circulares
      cancelAllRequestsRef.current?.();
    };
  }, []); // Dependencias vacías para evitar bucles infinitos

  return {
    submit,
    cancelAllRequests,
    state,
    canSubmit: !state.isSubmitting && state.connectionQuality !== 'offline',
    pendingRequestsCount: pendingRequests.current.size
  };
}

export default useConnectionAwareSubmit; 