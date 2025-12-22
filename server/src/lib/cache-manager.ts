import logger from '../config/logger.js';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();

  constructor() {
    // Limpieza periódica de entradas expiradas
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
          logger.debug({ cacheKey: key }, 'Entrada de caché expirada y eliminada');
        }
      }
    }, 60 * 1000); // Cada minuto
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() < entry.expiresAt) {
      logger.debug({ cacheKey: key }, 'Cache hit');
      return entry.data as T;
    }
    logger.debug({ cacheKey: key }, 'Cache miss');
    return null;
  }

  set<T>(key: string, data: T, ttlSeconds: number = 60): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expiresAt });
    logger.debug({ cacheKey: key, ttl: ttlSeconds }, 'Dato guardado en caché');
  }

  del(key: string): void {
    this.cache.delete(key);
    logger.debug({ cacheKey: key }, 'Entrada de caché eliminada manualmente');
  }

  flush(): void {
    this.cache.clear();
    logger.info('Caché limpiado completamente');
  }
}

export const cache = new CacheManager(); 