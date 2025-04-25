/**
 * Maps menu item database row to DTO with consistent naming
 */
export const toMenuItemDTO = (row: any) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  category: row.category,
  priceCents: row.priceCents || row.price_cents,
  prepSeconds: row.prepSeconds || row.prep_seconds,
  station: row.station,
  imageUrl: row.imageUrl || row.image_url,
  active: row.active
});

/**
 * Maps order database row to DTO with consistent naming
 */
export const toOrderDTO = (row: any) => ({
  id: row.id,
  bayId: row.bayId || row.bay_id,
  status: row.status,
  orderType: row.orderType || row.order_type,
  specialInstructions: row.specialInstructions || row.special_instructions,
  createdAt: row.createdAt || row.created_at
});

/**
 * Maps order item database row to DTO with consistent naming
 */
export const toOrderItemDTO = (row: any) => ({
  id: row.id,
  orderId: row.orderId || row.order_id,
  menuItemId: row.menuItemId || row.menu_item_id,
  quantity: row.quantity,
  firedAt: row.firedAt || row.fired_at,
  readyBy: row.readyBy || row.ready_by,
  completed: row.completed,
  notes: row.notes
});

/**
 * Maps bay database row to DTO with consistent naming
 */
export const toBayDTO = (row: any) => ({
  id: row.id,
  number: row.number,
  floor: row.floor,
  status: row.status
});

/**
 * Maps category database row to DTO with consistent naming
 */
export const toCategoryDTO = (row: any) => ({
  id: row.id,
  name: row.name,
  slug: row.slug
});