import { z } from "zod";

export const CreateOrderSchema = z.object({
  body: z.object({
    userId: z.number().positive(),
    items: z.array(z.object({
      productId: z.number().positive(),
      quantity: z.number().int().positive("La cantidad debe ser mayor a 0")
    })).min(1, "El pedido debe tener al menos un producto")
  })
});