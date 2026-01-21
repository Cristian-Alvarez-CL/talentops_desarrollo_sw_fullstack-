import { jest, describe, test, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { AppDataSource } from '../src/lib/database.js';
import { createOrder } from '../src/controllers/OrderController.js';
import { User } from '../src/entities/User.js';
import { Product } from '../src/entities/Product.js';
import { UserFactory, ProductFactory } from './helpers/factories.js';
import jwt from 'jsonwebtoken';
import { authenticate } from '../src/middleware/auth.middleware.js';

const app = express();
app.use(express.json());
// @ts-ignore
app.post('/orders', createOrder);

beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }
});

afterAll(async () => {
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }
});

afterEach(async () => {
    if (AppDataSource.isInitialized) {
    
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        try {
            await queryRunner.query('TRUNCATE "order_item", "order", "product", "user" RESTART IDENTITY CASCADE');
        } finally {
            await queryRunner.release();
        }
    }
});

describe('E-commerce System Tests', () => {
    test('Debe procesar pedido y reducir stock (Transacción Exitosa)', async () => {
        const userRepo = AppDataSource.getRepository(User);
        const productRepo = AppDataSource.getRepository(Product);

        const user = await userRepo.save({ email: `test-${Date.now()}@dev.com` });
        const product = await productRepo.save({ name: "Laptop", price: 1000, stock: 10 });

        const res = await request(app).post('/orders').send({
            userId: user.id,
            items: [{ productId: product.id, quantity: 3 }]
        });

        expect(res.status).toBe(201);
        
        const updatedProduct = await productRepo.findOneBy({ id: product.id });
        expect(Number(updatedProduct?.stock)).toBe(7);
    });

    test('Debe hacer Rollback si no hay stock suficiente', async () => {
        const userRepo = AppDataSource.getRepository(User);
        const productRepo = AppDataSource.getRepository(Product);

        const user = await userRepo.save({ email: `fail-${Date.now()}@dev.com` });
        const product = await productRepo.save({ name: "Stock 0", price: 10, stock: 0 });

        const res = await request(app).post('/orders').send({
            userId: user.id,
            items: [{ productId: product.id, quantity: 1 }]
        });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain("Stock insuficiente");
    });
});

describe('Testing de Autorización y Lógica de Negocio', () => {
    
    test('Debe fallar si no se proporciona un token (Autorización)', async () => {
        const res = await request(app).post('/orders').send({ userId: 1, items: [] });
        expect(res.status).toBe(400);
    });

    test('Regla de Negocio: No permitir pedidos con stock insuficiente', async () => {
        const user = await UserFactory();
        const product = await ProductFactory({ stock: 2 });
        const token = jwt.sign({ id: user.id, role: user.role }, "secret");

        const res = await request(app)
            .post('/orders')
            .set('Authorization', `Bearer ${token}`)
            .send({
                userId: user.id,
                items: [{ productId: product.id, quantity: 5 }] // Más del stock disponible
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain("Stock insuficiente");
    });
});