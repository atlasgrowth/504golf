export interface MenuItemDTO {
  id: string;
  name: string;
  description: string | null;
  category: string;
  priceCents: number;
  prepSeconds: number;
  station: string;
  imageUrl: string | null;
  active: boolean;
}

/**
 * Maps menu item database row to DTO with consistent naming
 */
export const toMenuItemDTO = (row: any): MenuItemDTO => ({
  id: row.id,
  name: row.name,
  description: row.description,
  category: row.category,
  priceCents: row.priceCents || row.price_cents || 0,
  prepSeconds: row.prepSeconds || row.prep_seconds || 0,
  station: row.station || '',
  imageUrl: row.imageUrl || row.image_url,
  active: typeof row.active === 'boolean' ? row.active : true
});

export interface OrderDTO {
  id: string;
  bayId: number;
  status: string;
  orderType: string; 
  specialInstructions: string | null;
  createdAt: string; // Always convert to string ISO format for consistency
  estimatedCompletionTime: string | null;
}

/**
 * Maps order database row to DTO with consistent naming
 */
export const toOrderDTO = (row: any): OrderDTO => ({
  id: row.id,
  bayId: row.bayId || row.bay_id,
  status: row.status,
  orderType: row.orderType || row.order_type || 'server',
  specialInstructions: row.specialInstructions || row.special_instructions,
  createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : 
            (row.created_at instanceof Date ? row.created_at.toISOString() : 
             row.createdAt || row.created_at || new Date().toISOString()),
  estimatedCompletionTime: row.estimatedCompletionTime instanceof Date ? 
                          row.estimatedCompletionTime.toISOString() : 
                          (row.estimated_completion_time instanceof Date ? 
                           row.estimated_completion_time.toISOString() : 
                           row.estimatedCompletionTime || row.estimated_completion_time)
});

export interface OrderItemDTO {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  status: string | null;
  station: string | null;
  completed: boolean;
  cookSeconds: number | null;
  firedAt: string | null; // ISO string
  readyAt: string | null; // ISO string
  deliveredAt: string | null; // ISO string
  readyBy: string | null; // ISO string
  notes: string | null;
  menuItem?: MenuItemDTO;
}

/**
 * Maps order item database row to DTO with consistent naming
 */
export const toOrderItemDTO = (row: any): OrderItemDTO => ({
  id: row.id,
  orderId: row.orderId || row.order_id,
  menuItemId: row.menuItemId || row.menu_item_id,
  quantity: row.quantity || 1,
  status: row.status,
  station: row.station,
  completed: typeof row.completed === 'boolean' ? row.completed : false,
  cookSeconds: row.cookSeconds || row.cook_seconds || null,
  // Convert Date objects to ISO strings for all date fields
  firedAt: row.firedAt instanceof Date ? row.firedAt.toISOString() : 
          (row.fired_at instanceof Date ? row.fired_at.toISOString() : 
           row.firedAt || row.fired_at),
  readyAt: row.readyAt instanceof Date ? row.readyAt.toISOString() : 
          (row.ready_at instanceof Date ? row.ready_at.toISOString() : 
           row.readyAt || row.ready_at),
  deliveredAt: row.deliveredAt instanceof Date ? row.deliveredAt.toISOString() : 
               (row.delivered_at instanceof Date ? row.delivered_at.toISOString() : 
                row.deliveredAt || row.delivered_at),
  readyBy: row.readyBy instanceof Date ? row.readyBy.toISOString() : 
          (row.ready_by instanceof Date ? row.ready_by.toISOString() : 
           row.readyBy || row.ready_by),
  notes: row.notes,
  menuItem: row.menuItem ? toMenuItemDTO(row.menuItem) : undefined
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