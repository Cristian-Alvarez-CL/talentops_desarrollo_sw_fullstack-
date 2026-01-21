import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, type Relation } from "typeorm";
import { User } from "./User.js";
import { OrderItem } from "./OrderItem.js";

@Entity()
export class Order {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("decimal", { precision: 10, scale: 2 })
    total!: number;

    @ManyToOne(() => User, (user) => user.orders)
    user!: Relation<User>; // Usa Relation<>

    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
    items!: Relation<OrderItem[]>; // Usa Relation<>
}