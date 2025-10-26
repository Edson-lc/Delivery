import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Exportar modelos do Prisma
export const User = prisma.user;
export const Order = prisma.order;
export const Customer = prisma.customer;
export const Cart = prisma.cart;
export const CartItem = prisma.cartItem;
export const Restaurant = prisma.restaurant;
export const MenuItem = prisma.menuItem;
export const Category = prisma.category;
export const Address = prisma.address;
export const Delivery = prisma.delivery;
export const DeliveryDriver = prisma.deliveryDriver;

export default prisma;
