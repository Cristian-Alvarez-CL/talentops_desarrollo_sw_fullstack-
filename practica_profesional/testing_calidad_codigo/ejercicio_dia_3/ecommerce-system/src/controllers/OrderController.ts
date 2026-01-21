import type { Request, Response } from "express";
import { OrderService } from "../services/OrderService.js";

export const createOrder = async (req: Request, res: Response) => {
    try {
        const { userId, items } = req.body;
        const result = await OrderService.createOrder(userId, items);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};