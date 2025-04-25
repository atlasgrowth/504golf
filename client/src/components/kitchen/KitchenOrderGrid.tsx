import { useQueryClient } from "@tanstack/react-query";
import { OrderSummary } from "@shared/schema";
import { OrderCard } from "./OrderCard";

interface KitchenOrderGridProps {
  orders: OrderSummary[];
}

export default function KitchenOrderGrid({ orders }: KitchenOrderGridProps) {
  const queryClient = useQueryClient();
  
  // Sort orders - delayed first, then by estimated completion time
  const sortedOrders = [...orders].sort((a, b) => {
    // Delayed orders first
    if (a.isDelayed && !b.isDelayed) return -1;
    if (!a.isDelayed && b.isDelayed) return 1;
    
    // Then by status - cooking before new
    if (a.status !== b.status) {
      if (a.status === 'COOKING') return -1;
      if (b.status === 'COOKING') return 1;
    }
    
    // Then by estimated completion time
    if (a.estimatedCompletionTime && b.estimatedCompletionTime) {
      return new Date(a.estimatedCompletionTime).getTime() - new Date(b.estimatedCompletionTime).getTime();
    }
    
    // Finally by time elapsed
    return b.timeElapsed - a.timeElapsed;
  });
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {sortedOrders.length === 0 ? (
        <div className="col-span-full p-8 text-center text-neutral-500 bg-white rounded-md shadow-md">
          No orders in this category
        </div>
      ) : (
        sortedOrders.map((order) => (
          <OrderCard 
            key={order.id} 
            order={order} 
            expanded={order.isDelayed} // Auto-expand delayed orders
          />
        ))
      )}
    </div>
  );
}
