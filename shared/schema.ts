import { pgTable, text, serial, integer, boolean, timestamp, uuid, smallint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("customer"), // admin, server, kitchen, customer
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  slug: true,
});

// Menu items table
export const menuItems = pgTable("menu_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  category: text("category").notNull(),  // Shareables, Smashburgers, etc.
  price_cents: integer("price_cents").notNull(), // Price in cents
  station: text("station").notNull(),   // Fry, Cold, FlatTop, etc.
  prep_seconds: integer("prep_seconds").notNull(), // Prep time in seconds
  description: text("description"), // Optional description
  image_url: text("image_url"), // Optional image URL
  active: boolean("active").notNull().default(true),
});

export const insertMenuItemSchema = createInsertSchema(menuItems).pick({
  name: true, 
  category: true,
  price_cents: true,
  station: true,
  prep_seconds: true,
  description: true,
  image_url: true,
  active: true,
});

// Bays table
export const bays = pgTable("bays", {
  id: smallint("id").primaryKey(), // Bay numbers from 1-100
  number: smallint("number").notNull(), // Bay number (same as id for now)
  floor: smallint("floor").notNull(), // Floor number (1-3)
  status: text("status").notNull().default("empty"), // empty, occupied, active, flagged
});

export const insertBaySchema = createInsertSchema(bays).pick({
  id: true,
  number: true,
  floor: true,
  status: true,
});

// Orders table
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  bayId: smallint("bay_id").notNull(),
  status: text("status").notNull().default("NEW"), // NEW, COOKING, READY, SERVED, LATE
  createdAt: timestamp("created_at").notNull().defaultNow(),
  specialInstructions: text("special_instructions"),
  orderType: text("order_type").notNull().default("customer"), // customer, server
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  bayId: true,
  status: true,
  specialInstructions: true,
  orderType: true,
});

// Order items table
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull(),
  menuItemId: uuid("menu_item_id").notNull(),
  qty: integer("qty").notNull(),
  firedAt: timestamp("fired_at"),
  readyBy: timestamp("ready_by"),
  completed: boolean("completed").notNull().default(false),
  notes: text("notes"),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  menuItemId: true,
  qty: true,
  notes: true,
});

// Define relations
export const menuItemsRelations = relations(menuItems, ({ many }) => ({
  orderItems: many(orderItems),
}));

export const baysRelations = relations(bays, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  bay: one(bays, { fields: [orders.bayId], references: [bays.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  menuItem: one(menuItems, { fields: [orderItems.menuItemId], references: [menuItems.id] }),
}));

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
  id: string;
  orderNumber?: string;
  bayId: number;
  bayNumber?: number;
  floor: number;
  status: string;
  createdAt: Date;
  timeElapsed: number; // minutes since creation
  totalItems: number;
  isDelayed: boolean;
};

export type CartItem = {
  menuItemId: string;
  name: string;
  priceCents: number;
  quantity: number;
};

export type Cart = {
  items: CartItem[];
  specialInstructions?: string;
};
