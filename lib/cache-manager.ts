'use client';

// Sistema de Cache Avanzado para Optimización de Rendimiento
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  key: string;
  metadata?: {
    hitCount: number;
    lastAccessed: number;
    priority: number;
  };
}

interface CacheConfig {
  defaultTTL: number; // Time to live en milisegundos
  maxSize: number; // Máximo número de elementos
  enableCompression: boolean;
  enableEncryption: boolean;
  persistToStorage: boolean;
}

class AdvancedCacheManager {
  private cache: Map<string, CacheItem<any>>;
  private config: CacheConfig;
  private metrics: {
    hits: number;
    misses: number;
    evictions: number;
    totalRequests: number;
  };
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.cache = new Map();
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutos por defecto
      maxSize: 1000,
      enableCompression: true,
      enableEncryption: false,
      persistToStorage: true,
      ...config,
    };
    
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0,
    };

    this.initializeCache();
    this.startCleanupTimer();
  }

  private initializeCache() {
    if (typeof window !== 'undefined' && this.config.persistToStorage) {
      try {
        const savedCache = localStorage.getItem('app-cache');
        if (savedCache) {
          const parsedCache = JSON.parse(savedCache);
          const now = Date.now();
          
          // Restaurar solo elementos no expirados
          Object.entries(parsedCache).forEach(([key, item]: [string, any]) => {
            if (item.expiresAt > now) {
              this.cache.set(key, {
                ...item,
                metadata: {
                  hitCount: 0,
                  lastAccessed: now,
                  priority: 1,
                  ...item.metadata,
                },
              });
            }
          });
        }
      } catch (error) {
        console.warn('No se pudo restaurar el cache:', error);
      }
    }
  }

  private startCleanupTimer() {
    // Limpieza cada 2 minutos
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
      this.saveToStorage();
    }, 2 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    let evicted = 0;

    // Remover elementos expirados
    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt <= now) {
        this.cache.delete(key);
        evicted++;
      }
    }

    // Si aún hay muchos elementos, usar LRU con prioridad
    if (this.cache.size > this.config.maxSize) {
      const sortedItems = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => {
          // Ordenar por prioridad y último acceso
          const priorityDiff = (a.metadata?.priority || 1) - (b.metadata?.priority || 1);
          if (priorityDiff !== 0) return priorityDiff;
          
          return (a.metadata?.lastAccessed || 0) - (b.metadata?.lastAccessed || 0);
        });

      // Remover los menos utilizados
      const toRemove = sortedItems.slice(0, this.cache.size - this.config.maxSize);
      toRemove.forEach(([key]) => {
        this.cache.delete(key);
        evicted++;
      });
    }

    this.metrics.evictions += evicted;
  }

  private saveToStorage() {
    if (typeof window !== 'undefined' && this.config.persistToStorage) {
      try {
        const cacheObj = Object.fromEntries(this.cache.entries());
        localStorage.setItem('app-cache', JSON.stringify(cacheObj));
      } catch (error) {
        console.warn('No se pudo guardar el cache:', error);
      }
    }
  }

  private compressData(data: any): string {
    if (!this.config.enableCompression) return JSON.stringify(data);
    
    // Compresión simple usando JSON.stringify con reemplazos
    const jsonString = JSON.stringify(data);
    return jsonString.replace(/\s+/g, ' ').trim();
  }

  private decompressData(compressedData: string): any {
    return JSON.parse(compressedData);
  }

  // Método principal para obtener datos
  async get<T>(key: string): Promise<T | null> {
    this.metrics.totalRequests++;
    
    const item = this.cache.get(key);
    const now = Date.now();

    if (!item || item.expiresAt <= now) {
      this.metrics.misses++;
      if (item) {
        this.cache.delete(key); // Remover elemento expirado
      }
      return null;
    }

    // Actualizar metadata de acceso
    item.metadata = {
      hitCount: (item.metadata?.hitCount || 0) + 1,
      lastAccessed: now,
      priority: Math.min((item.metadata?.priority || 1) + 0.1, 10),
    };

    this.metrics.hits++;
    return item.data;
  }

  // Método para almacenar datos
  async set<T>(
    key: string, 
    data: T, 
    ttl?: number, 
    priority: number = 1
  ): Promise<void> {
    const now = Date.now();
    const expiresAt = now + (ttl || this.config.defaultTTL);

    const item: CacheItem<T> = {
      data,
      timestamp: now,
      expiresAt,
      key,
      metadata: {
        hitCount: 0,
        lastAccessed: now,
        priority,
      },
    };

    this.cache.set(key, item);

    // Limpieza preventiva si excedemos el tamaño
    if (this.cache.size > this.config.maxSize * 1.1) {
      this.cleanup();
    }
  }

  // Método para invalidar cache
  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Método para obtener métricas
  getMetrics() {
    const hitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.hits / this.metrics.totalRequests) * 100 
      : 0;

    return {
      ...this.metrics,
      hitRate: parseFloat(hitRate.toFixed(2)),
      cacheSize: this.cache.size,
      memoryUsage: this.cache.size * 100, // Estimación aproximada
    };
  }

  // Método para limpiar y destruir
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.saveToStorage();
    this.cache.clear();
  }
}

// Instancia global del cache manager
let globalCacheManager: AdvancedCacheManager | null = null;

export function getCacheManager(): AdvancedCacheManager {
  if (!globalCacheManager) {
    globalCacheManager = new AdvancedCacheManager({
      defaultTTL: 5 * 60 * 1000, // 5 minutos
      maxSize: 500,
      enableCompression: true,
      persistToStorage: true,
    });
  }
  return globalCacheManager;
}

// Hook para usar cache en React
export function useCache() {
  const cacheManager = getCacheManager();

  const getCachedData = async <T>(key: string): Promise<T | null> => {
    return await cacheManager.get<T>(key);
  };

  const setCachedData = async <T>(
    key: string, 
    data: T, 
    ttl?: number, 
    priority?: number
  ): Promise<void> => {
    await cacheManager.set(key, data, ttl, priority);
  };

  const invalidateCache = (pattern?: string): void => {
    cacheManager.invalidate(pattern);
  };

  const getCacheMetrics = () => {
    return cacheManager.getMetrics();
  };

  return {
    get: getCachedData,
    set: setCachedData,
    invalidate: invalidateCache,
    metrics: getCacheMetrics,
  };
}

// Decorador para cachear funciones automáticamente
export function cached(ttl: number = 5 * 60 * 1000, priority: number = 1) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const cacheManager = getCacheManager();

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}.${propertyKey}:${JSON.stringify(args)}`;
      
      // Intentar obtener del cache
      const cachedResult = await cacheManager.get(cacheKey);
      if (cachedResult !== null) {
        return cachedResult;
      }

      // Ejecutar método original
      const result = await originalMethod.apply(this, args);
      
      // Guardar en cache
      await cacheManager.set(cacheKey, result, ttl, priority);
      
      return result;
    };

    return descriptor;
  };
}

export default AdvancedCacheManager; 