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
  bayId: smallint("bay_id").notNull().references(() => bays.id),
  status: text("status").notNull().default("PENDING"), // Use OrderStatus.PENDING as default
  createdAt: timestamp("created_at").notNull().defaultNow(),
  specialInstructions: text("special_instructions"),
  orderType: text("order_type").notNull().default("customer"), // customer, server
  estimatedCompletionTime: timestamp("estimated_completion_time"), // New field for P2
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  bayId: true,
  status: true,
  specialInstructions: true,
  orderType: true,
  estimatedCompletionTime: true,
}).transform(data => ({
  ...data,
  // Use PENDING as default if status is not specified
  status: data.status === "pending" ? OrderStatus.PENDING : (data.status || OrderStatus.PENDING)
}));

// Order item status enum
export enum OrderItemStatus {
  NEW = "NEW",
  COOKING = "COOKING",
  READY = "READY",
  DELIVERED = "DELIVERED",
  VOIDED = "VOIDED"
}

// Order status enum
export enum OrderStatus {
  PENDING = "PENDING", // New status: order placed but not started
  NEW = "NEW",
  COOKING = "COOKING",
  READY = "READY",
  SERVED = "SERVED",
  CANCELLED = "CANCELLED"
}

// Order items table
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id),
  menuItemId: uuid("menu_item_id").notNull().references(() => menuItems.id),
  quantity: integer("qty").notNull(), // Changed column name to match database
  station: text("station"), // The station responsible for preparing the item
  status: text("status").$type<OrderItemStatus>().default(OrderItemStatus.NEW), // Current status of the item
  cookSeconds: integer("cook_seconds").default(300), // Time in seconds it should take to cook
  price_cents: integer("price_cents").default(0), // Price in cents
  firedAt: timestamp("fired_at", { withTimezone: true }), // When cooking started
  readyAt: timestamp("ready_at", { withTimezone: true }), // When item should be ready
  readyBy: timestamp("ready_by", { withTimezone: true }), // Legacy field - use readyAt instead
  deliveredAt: timestamp("delivered_at", { withTimezone: true }), // When the item was delivered to customer
  completed: boolean("completed").notNull().default(false), // Legacy field - true if delivered/completed
  notes: text("notes"), // Special preparation instructions
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  menuItemId: true,
  quantity: true,
  notes: true,
  station: true,
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
  bay: Bay,
  estimatedCompletionTime?: string | Date | null
};

export type OrderSummary = {
  id: string;
  bayId: number;
  bayNumber?: number;
  orderNumber?: string | number; // Display number for kitchen (usually derived from ID)
  floor: number;
  status: string;
  createdAt: Date;
  timeElapsed: number; // minutes since creation
  totalItems: number;
  isDelayed: boolean;
  estimatedCompletionTime?: string | Date | null;
};

export type CartItem = {
  menuItemId: string;
  name?: string;
  priceCents?: number;
  quantity: number;
  station?: string;
};

export type Cart = {
  items: CartItem[];
  specialInstructions?: string;
};