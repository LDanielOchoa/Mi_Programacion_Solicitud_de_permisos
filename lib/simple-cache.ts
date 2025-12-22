// Sistema de Cache Simplificado y Seguro
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class SimpleCacheManager {
  private cache: Map<string, CacheItem<any>>;
  private readonly defaultTTL: number = 5 * 60 * 1000; // 5 minutos

  constructor() {
    this.cache = new Map();
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    const now = Date.now();

    if (!item || item.expiresAt <= now) {
      if (item) {
        this.cache.delete(key);
      }
      return null;
    }

    return item.data;
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);

    const item: CacheItem<T> = {
      data,
      timestamp: now,
      expiresAt,
    };

    this.cache.set(key, item);

    // Limpieza simple si hay muchos elementos
    if (this.cache.size > 100) {
      this.cleanup();
    }
  }

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

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }

  getSize(): number {
    return this.cache.size;
  }
}

// Instancia global
let globalCache: SimpleCacheManager | null = null;

export function getSimpleCache(): SimpleCacheManager {
  if (!globalCache) {
    globalCache = new SimpleCacheManager();
  }
  return globalCache;
}

export default SimpleCacheManager; 