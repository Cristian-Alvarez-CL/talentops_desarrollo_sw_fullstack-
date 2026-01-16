import { Request, Response } from 'express';
import { z } from 'zod';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

// Esquema de validación del servidor
const productSchema = z.object({
  name: z.string().min(3, {
    message: "El nombre debe tener al menos 3 caracteres"
  }).max(100, {
    message: "El nombre no puede exceder los 100 caracteres"
  }),
  description: z.string().min(10, {
    message: "La descripción debe tener al menos 10 caracteres"
  }).max(500, {
    message: "La descripción no puede exceder los 500 caracteres"
  }),
  price: z.string()
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, {
      message: "El precio debe ser un número mayor a 0"
    })
    .transform((val) => parseFloat(val))
    .refine((val) => val <= 1000000, {
      message: "El precio no puede exceder $1,000,000"
    }),
  category: z.string().min(1, {
    message: "Debe seleccionar una categoría"
  }),
  stock: z.string()
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num >= 0;
    }, {
      message: "El stock debe ser un número entero no negativo"
    })
    .transform((val) => parseInt(val))
    .refine((val) => val <= 10000, {
      message: "El stock no puede exceder 10,000 unidades"
    }),
  sku: z.string()
    .min(3, {
      message: "El SKU debe tener al menos 3 caracteres"
    })
    .max(20, {
      message: "El SKU no puede exceder los 20 caracteres"
    })
    .regex(/^[A-Z0-9\-]+$/, {
      message: "El SKU solo puede contener letras mayúsculas, números y guiones"
    }),
  tags: z.string()
    .optional()
    .transform((val) => {
      if (!val) return [];
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })
    .refine((val) => val.length <= 10, {
      message: "No puedes agregar más de 10 etiquetas"
    }),
  specifications: z.string()
    .optional()
    .transform((val) => {
      if (!val) return {};
      try {
        const parsed = JSON.parse(val);
        return typeof parsed === 'object' && parsed !== null ? parsed : {};
      } catch {
        return {};
      }
    }),
});

// Tipo para el cuerpo de la solicitud
interface ProductRequestBody {
  name: string;
  description: string;
  price: string;
  category: string;
  stock: string;
  sku: string;
  tags?: string;
  specifications?: string;
}

export const validateProduct = (req: Request<{}, {}, ProductRequestBody>, res: Response) => {
  try {
    const result = productSchema.safeParse(req.body);
    
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: 'VALIDATION_ERROR'
      }));
      
      return res.status(400).json({ errors });
    }
    
    res.json({ valid: true });
  } catch (error: any) {
    console.error('Validation error:', error);
    
    res.status(400).json({
      errors: [{
        field: 'general',
        message: 'Error de validación',
        code: 'VALIDATION_ERROR'
      }]
    });
  }
};

export const createProduct = async (req: Request<{}, {}, ProductRequestBody>, res: Response) => {
  try {
    // Validar datos con Zod
    const validationResult = productSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: 'VALIDATION_ERROR'
      }));
      
      return res.status(400).json({ errors });
    }
    
    const productData = validationResult.data;
    
    // Acceder al archivo usando bracket notation para evitar problemas de tipos
    const file = (req as any).file;
    
    // Procesar imagen si existe
    let imageUrl: string | undefined;
    if (file) {
      // Validar tipo de imagen
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
        return res.status(400).json({
          errors: [{
            field: 'image',
            message: 'Tipo de imagen no válido. Use JPEG, PNG o WebP.',
            code: 'INVALID_IMAGE_TYPE'
          }]
        });
      }
      
      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          errors: [{
            field: 'image',
            message: 'La imagen no puede exceder 5MB',
            code: 'IMAGE_TOO_LARGE'
          }]
        });
      }
      
      try {
        // Optimizar imagen
        const optimizedImage = await sharp(file.buffer)
          .resize(1200, 1200, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .jpeg({ quality: 80 })
          .toBuffer();
        
        // En un caso real, aquí subirías a S3, Cloudinary, etc.
        const filename = `${uuidv4()}.jpg`;
        imageUrl = `/uploads/${filename}`;
        
        // Simular delay de upload
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            resolve();
          }, 1000);
        });
      } catch (sharpError: any) {
        console.error('Error procesando imagen:', sharpError);
        return res.status(400).json({
          errors: [{
            field: 'image',
            message: 'Error al procesar la imagen',
            code: 'IMAGE_PROCESSING_ERROR'
          }]
        });
      }
    }
    
    // Simular creación en base de datos
    const product = {
      id: uuidv4(),
      ...productData,
      imageUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    res.status(201).json({
      message: 'Producto creado exitosamente',
      product
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    
    // Error de Zod
    if (error.name === 'ZodError') {
      const errors = error.issues.map((issue: any) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: 'VALIDATION_ERROR'
      }));
      return res.status(400).json({ errors });
    }
    
    res.status(500).json({
      errors: [{
        field: 'general',
        message: 'Error interno del servidor',
        code: 'INTERNAL_SERVER_ERROR'
      }]
    });
  }
};