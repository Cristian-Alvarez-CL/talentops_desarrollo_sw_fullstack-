import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, type Relation } from "typeorm";
import { Order } from "./Order.js";
import { Product } from "./Product.js";

@Entity()
export class OrderItem {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("decimal")
    price!: number;

    @Column()
    quantity!: number;

    @ManyToOne(() => Order, (order) => order.items)
    order!: Relation<Order>; 

    @ManyToOne(() => Product)
    product!: Relation<Product>;
}