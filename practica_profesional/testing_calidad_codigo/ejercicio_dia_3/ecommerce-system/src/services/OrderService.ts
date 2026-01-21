import { AppDataSource } from "../lib/database.js";
import { Order } from "../entities/Order.js";
import { Product } from "../entities/Product.js";
import { OrderItem } from "../entities/OrderItem.js";
import { User } from "../entities/User.js";

export class OrderService {
    static async createOrder(userId: number, items: { productId: number, quantity: number }[]) {
        // Atomicidad garantizada vía Transacción
        return await AppDataSource.transaction(async (manager) => {
            const user = await manager.findOneBy(User, { id: userId });
            if (!user) throw new Error("Usuario no encontrado");

            let total = 0;
            const order = new Order();
            order.user = user;
            order.items = [];

            for (const item of items) {
                const product = await manager.findOneBy(Product, { id: item.productId });
                
                if (!product || product.stock < item.quantity) {
                    throw new Error(`Stock insuficiente para producto ID: ${item.productId}`);
                }

                // 1. Descontar Stock
                product.stock -= item.quantity;
                await manager.save(product);

                // 2. Crear Item de pedido
                const orderItem = new OrderItem();
                orderItem.product = product;
                orderItem.quantity = item.quantity;
                orderItem.price = product.price;
                
                total += Number(product.price) * item.quantity;
                order.items.push(orderItem);
            }

            order.total = total;
            return await manager.save(order);
        });
    }
}