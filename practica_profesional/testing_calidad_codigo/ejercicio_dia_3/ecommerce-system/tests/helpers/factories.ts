import { AppDataSource } from "../../src/lib/database.js";
import { User } from "../../src/entities/User.js";
import { Product } from "../../src/entities/Product.js";

export const UserFactory = async (overrides = {}) => {
  const repo = AppDataSource.getRepository(User);
  return await repo.save({
    email: `user-${Date.now()}@example.com`,
    role: "CUSTOMER",
    ...overrides
  });
};

export const ProductFactory = async (overrides = {}) => {
  const repo = AppDataSource.getRepository(Product);
  return await repo.save({
    name: "Test Product",
    price: 50.0,
    stock: 10,
    ...overrides
  });
};