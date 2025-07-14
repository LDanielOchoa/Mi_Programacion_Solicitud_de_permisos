import { HTTPException } from 'hono/http-exception';
import { ZodSchema } from 'zod';

export const validateWithZod = <T>(schema: ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    // Formatear errores para una mejor depuración
    const errorMessage = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new HTTPException(400, {
      message: `Error de validación: ${errorMessage}`
    });
  }
  return result.data;
}; 