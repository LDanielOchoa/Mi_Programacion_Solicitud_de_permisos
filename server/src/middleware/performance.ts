import { Context, Next } from 'hono';
import logger from '../config/logger.js';

// Middleware de logging de peticiones
export const requestLogger = async (c: Context, next: Next) => {
  await next();
  const { req, res } = c;
  const log = {
    method: req.method,
    url: req.url,
    status: res.status,
  };
  logger.info(log, 'Request handled');
};


// Middleware de monitoreo de rendimiento
const performanceMiddleware = async (c: Context, next: Next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  c.header('X-Response-Time', `${ms}ms`);
  logger.debug({ url: c.req.url, duration: ms }, 'Request duration');
};

export default performanceMiddleware; 