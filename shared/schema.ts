import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("server"), // server, kitchen, admin
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

// Menu categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  slug: true,
});

// Menu items
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // Price in cents
  categoryId: integer("category_id").notNull(),
  prepTime: integer("prep_time").notNull(), // Prep time in minutes
  imageUrl: text("image_url"),
  active: boolean("active").notNull().default(true),
});

export const insertMenuItemSchema = createInsertSchema(menuItems).pick({
  name: true,
  description: true,
  price: true,
  categoryId: true,
  prepTime: true,
  imageUrl: true,
  active: true,
});

// Bays (golf facility locations)
export const bays = pgTable("bays", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull().unique(),
  floor: integer("floor").notNull(),
  status: text("status").notNull().default("empty"), // empty, occupied, active, flagged, alert
});

export const insertBaySchema = createInsertSchema(bays).pick({
  number: true,
  floor: true,
  status: true,
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  bayId: integer("bay_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, preparing, ready, served, cancelled
  orderType: text("order_type").notNull(), // customer, server
  specialInstructions: text("special_instructions"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  estimatedCompletionTime: timestamp("estimated_completion_time"),
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  orderNumber: true,
  bayId: true,
  status: true,
  orderType: true,
  specialInstructions: true,
});

// Order items
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  menuItemId: integer("menu_item_id").notNull(),
  quantity: integer("quantity").notNull(),
  completed: boolean("completed").notNull().default(false),
  notes: text("notes"),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  menuItemId: true,
  quantity: true,
  notes: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

export type Bay = typeof bays.$inferSelect;
export type InsertBay = z.infer<typeof insertBaySchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

// Composite types for requests/responses
export type OrderWithItems = Order & { 
  items: (OrderItem & { menuItem: MenuItem })[], 
  bay: Bay 
};

export type OrderSummary = {
  id: number;
  orderNumber: string;
  bayId: number;
  bayNumber: number;
  floor: number;
  status: string;
  createdAt: Date;
  timeElapsed: number; // minutes since creation
  totalItems: number;
  isDelayed: boolean;
};

export type CartItem = {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
};

export type Cart = {
  items: CartItem[];
  specialInstructions?: string;
};
