import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TimerPill } from "@/components/ui/timer-badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { OrderSummary, OrderWithItems } from "@shared/schema";

interface KitchenOrderGridProps {
  orders: OrderSummary[];
}

export default function KitchenOrderGrid({ orders }: KitchenOrderGridProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Helper function to determine order card style
  const getOrderCardStyle = (order: OrderSummary) => {
    if (order.isDelayed) {
      return "bg-danger bg-opacity-10 border-l-4 border-danger";
    } else if (order.timeElapsed > 15) {
      return "bg-warning bg-opacity-10 border-l-4 border-warning";
    } else {
      return "bg-white border-l-4 border-success";
    }
  };
  
  // Helper function to determine time status text
  const getTimeStatusText = (order: OrderSummary) => {
    if (order.isDelayed) {
      return "Delayed!";
    } else if (order.timeElapsed > 15) {
      return "Running late";
    } else {
      return "On time";
    }
  };
  
  // Helper function to determine time status color
  const getTimeStatusColor = (order: OrderSummary) => {
    if (order.isDelayed) {
      return "text-danger";
    } else if (order.timeElapsed > 15) {
      return "text-warning";
    } else {
      return "text-success";
    }
  };
  
  // Load full order details
  const getOrderDetails = (orderId: string) =>
    useQuery<OrderWithItems>({
      // API route is /api/order/:id  (singular)
      queryKey: ["/api/order", orderId],
      queryFn: async () => {
        console.log(`Fetching order details for order ${orderId}`);
        const response = await apiRequest("GET", `/api/order/${orderId}`);
        console.log(`Order details response for ${orderId}:`, response);
        return response;
      },
      staleTime: 10_000,
    });
  
  // Mark item as completed
  const toggleItemCompletion = async (orderItemId: string, completed: boolean) => {
    try {
      // If the item hasn't been fired yet, call /fire first
      const endpoint = completed ? "/ready" : "/fire";
      await apiRequest("POST", `/api/order-items/${orderItemId}${endpoint}`);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/order'] });
      
      toast({
        title: completed ? "Item Ready" : "Item Fired",
        description: "Order item status has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item status.",
        variant: "destructive",
      });
    }
  };
  
  // Mark order as ready
  const markOrderAsReady = async (orderId: string) => {
    try {
      await apiRequest("POST", `/api/order/${orderId}/ready`);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/order'] });
      
      toast({
        title: "Order Ready",
        description: "Order has been marked as ready to serve.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {orders.length === 0 ? (
        <div className="col-span-3 p-8 text-center text-neutral-500 bg-white rounded-md shadow-md">
          No orders in this category
        </div>
      ) : (
        orders.map((order) => {
          const { data: orderDetails, isLoading, error } = getOrderDetails(order.id);
          
          console.log(`Order ${order.id} details:`, { orderDetails, isLoading, error });
          
          return (
            <div 
              key={order.id} 
              className={cn(
                "rounded-md shadow-md",
                getOrderCardStyle(order)
              )}
            >
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm font-medium text-neutral-600">Order #{order.orderNumber}</span>
                    <h3 className="font-poppins font-bold text-lg">Bay {order.bayNumber} (Floor {order.floor})</h3>
                    <p className="text-xs text-neutral-500">
                      Placed&nbsp;
                      {new Date(order.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      &nbsp;—&nbsp;{order.timeElapsed} min ago
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <TimerPill minutes={order.timeElapsed} isDelayed={order.isDelayed} />
                    <span className={cn("mt-1 text-xs", getTimeStatusColor(order))}>
                      {getTimeStatusText(order)}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  {isLoading ? (
                    <div className="p-2 bg-white rounded-md flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : error ? (
                    <div className="p-2 bg-white rounded-md text-red-500">
                      Error loading items: {error.message}
                    </div>
                  ) : orderDetails?.items && orderDetails.items.length > 0 ? (
                    orderDetails.items.map((item) => (
                      <div 
                        key={item.id} 
                        className={cn(
                          "flex justify-between p-2 rounded-md",
                          item.completed ? "bg-neutral-100" : "bg-white"
                        )}
                      >
                        <div className="flex items-center">
                          <Checkbox 
                            checked={item.completed} 
                            onCheckedChange={(checked) => toggleItemCompletion(item.id, checked as boolean)}
                            className="mr-2 h-4 w-4 text-primary"
                          />
                          <span className={item.completed ? "text-neutral-800 line-through" : "text-neutral-800"}>
                            {item.quantity}x {item.menuItem?.name || 'Unknown Item'}
                          </span>
                        </div>
                        <span className="text-xs text-neutral-500">
                          {item.menuItem?.prep_seconds ? `${Math.round(item.menuItem.prep_seconds / 60)} min prep` : 'Standard prep'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 bg-white rounded-md">
                      <span className="text-neutral-800">{order.totalItems} items</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex justify-between">
                  <div>
                    <span className="text-xs text-neutral-600">Special instructions:</span>
                    <p className="text-sm italic">{orderDetails?.specialInstructions || "None"}</p>
                  </div>
                  <button 
                    className="bg-white border border-primary text-primary px-3 py-1 rounded-md text-sm font-medium"
                    onClick={() => markOrderAsReady(order.id)}
                  >
                    Ready
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
