import type { MenuItem, Order, OrderItem, Bay, Category } from "@shared/schema";

/**
 * Maps menu item database row to DTO with consistent naming
 */
export const toMenuItemDTO = (row: MenuItem) => ({
  id: row.id,
  name: row.name,
  category: row.category,
  priceCents: row.price_cents,
  prepSeconds: row.prep_seconds,
  station: row.station,
  description: row.description,
  imageUrl: row.image_url,
  active: row.active
});

/**
 * Maps order database row to DTO with consistent naming
 */
export const toOrderDTO = (row: Order) => ({
  id: row.id,
  orderNumber: row.orderNumber,
  bayId: row.bayId,
  status: row.status,
  specialInstructions: row.specialInstructions,
  createdAt: row.createdAt
});

/**
 * Maps order item database row to DTO with consistent naming
 */
export const toOrderItemDTO = (row: OrderItem) => ({
  id: row.id,
  orderId: row.orderId,
  menuItemId: row.menuItemId,
  quantity: row.qty,
  firedAt: row.firedAt,
  readyBy: row.readyBy,
  completed: row.completed,
  notes: row.notes
});

/**
 * Maps bay database row to DTO with consistent naming
 */
export const toBayDTO = (row: Bay) => ({
  id: row.id,
  number: row.number,
  floor: row.floor,
  status: row.status
});

/**
 * Maps category database row to DTO with consistent naming
 */
export const toCategoryDTO = (row: Category) => ({
  id: row.id,
  name: row.name,
  slug: row.slug
});