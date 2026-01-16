import { z } from 'zod';

const productFormSchema = z.object({
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder los 100 caracteres')
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-]+$/, 'El nombre solo puede contener letras, números y espacios'),

  description: z.string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(500, 'La descripción no puede exceder los 500 caracteres'),

  price: z.number()
    .positive('El precio debe ser mayor a 0')
    .max(1000000, 'El precio no puede exceder $1,000,000'),

  category: z.string()
    .min(1, 'Debe seleccionar una categoría'),

  stock: z.number()
    .int('El stock debe ser un número entero')
    .min(0, 'El stock no puede ser negativo')
    .max(10000, 'El stock no puede exceder 10,000 unidades'),

  sku: z.string()
    .min(3, 'El SKU debe tener al menos 3 caracteres')
    .max(20, 'El SKU no puede exceder los 20 caracteres')
    .regex(/^[A-Z0-9\-]+$/, 'El SKU solo puede contener letras mayúsculas, números y guiones'),

  tags: z.array(z.string())
    .max(10, 'No puedes agregar más de 10 etiquetas'),

  specifications: z.record(z.string(), z.string()),

  image: z.instanceof(File, { message: 'Debe ser un archivo válido' })
    .refine((file) => file.size <= 5 * 1024 * 1024, 'La imagen no puede exceder 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Solo se permiten imágenes JPEG, PNG o WebP'
    )
    .optional()
    .or(z.literal(undefined))
});

export type ProductFormData = z.infer<typeof productFormSchema>;

export { productFormSchema as productSchema };