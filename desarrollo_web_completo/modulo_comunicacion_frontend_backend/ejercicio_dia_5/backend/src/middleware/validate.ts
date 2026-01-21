import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type RequestLocation = 'body' | 'query' | 'params';

export const validate = (schema: ZodSchema, location: RequestLocation = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dataToValidate = req[location];
      schema.parse(dataToValidate);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: 'VALIDATION_ERROR'
        }));

        res.status(400).json({
          success: false,
          message: 'Error de validación',
          errors
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        errors: [{ code: 'INTERNAL_ERROR', message: 'Error al validar datos' }]
      });
    }
  };
};
