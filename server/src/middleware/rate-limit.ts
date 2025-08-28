import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import logger from '../config/logger.js';

// Estructura para almacenar información de solicitudes
interface RequestTracker {
  timestamps: number[];
  count: number;
}

class RateLimiter {
  private requestMap: Map<string, RequestTracker> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 10000, maxRequests: number = 50) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  // Middleware para limitar solicitudes
  limit = async (c: Context, next: Next) => {
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const path = c.req.path;
    const method = c.req.method;

    // Rutas de autenticación y carga inicial más permisivas
    const authAndInitRoutes = [
      '/api/auth/user',
      '/api/auth/login',
      '/api/auth/verify-sso-token'
    ];

    const isAuthOrInitRoute = authAndInitRoutes.some(route => 
      path.startsWith(route)
    );

    // Si es una ruta de autenticación o carga inicial, omitir rate limiting
    if (isAuthOrInitRoute) {
      return next();
    }

    const key = `${ip}:${path}`;

    const now = Date.now();
    let tracker = this.requestMap.get(key);

    if (!tracker) {
      tracker = { timestamps: [], count: 0 };
      this.requestMap.set(key, tracker);
    }

    // Limpiar timestamps antiguos
    tracker.timestamps = tracker.timestamps.filter(
      timestamp => now - timestamp < this.windowMs
    );

    // Verificar límite de solicitudes
    if (tracker.timestamps.length >= this.maxRequests) {
      logger.warn({
        ip,
        path,
        method,
        requestCount: tracker.timestamps.length
      }, 'Solicitud bloqueada por rate limiting');

      throw new HTTPException(429, { 
        message: 'Demasiadas solicitudes. Por favor, espere unos segundos.' 
      });
    }

    // Agregar timestamp actual
    tracker.timestamps.push(now);

    await next();
  }
}

export const rateLimiter = new RateLimiter();
export default rateLimiter; 