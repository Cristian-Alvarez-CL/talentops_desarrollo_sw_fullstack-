import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { User } from "../entities/User.js";
import { Product } from "../entities/Product.js";
import { Order } from "../entities/Order.js";
import { OrderItem } from "../entities/OrderItem.js";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    synchronize: true, 
    logging: false,
    entities: [User, Product, Order, OrderItem], 
});