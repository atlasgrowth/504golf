import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import OrderPriorityTabs from "./OrderPriorityTabs";
import KitchenOrderGrid from "./KitchenOrderGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatus, OrderSummary } from "@shared/schema";
import { Clock, Bell, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function KitchenView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { lastMessage } = useWebSocket();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [currentTime, setCurrentTime] = useState<string>("");
  
  // Get active orders based on selected tab
  const endpoint = activeTab === "all" ? "/api/orders" : `/api/orders/${activeTab}`;
  const { data: orders, isLoading: ordersLoading } = useQuery<OrderSummary[]>({
    queryKey: [endpoint],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Update time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;
    
    console.log("Received WebSocket message:", lastMessage);
    
    // Handle different message types
    switch(lastMessage.type) {
      case 'ordersUpdate':
        const updatedOrders = lastMessage.data as OrderSummary[];
        queryClient.setQueryData(['/api/orders'], updatedOrders);
        
        // Check for new orders and notify
        if (orders && updatedOrders.length > orders.length) {
          toast({
            title: 'New Order Received',
            description: `A new order has been placed.`,
          });
        }
        break;
        
      case 'item_cooking':
        // Refresh order data when an item starts cooking
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
        queryClient.invalidateQueries({ queryKey: ['/api/order', lastMessage.data.orderId] });
        
        toast({
          title: 'Item Cooking',
          description: `Item started cooking for Bay ${lastMessage.data.bayNumber}`,
        });
        break;
        
      case 'item_ready':
        // Refresh order data when an item is ready
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
        queryClient.invalidateQueries({ queryKey: ['/api/order', lastMessage.data.orderId] });
        
        toast({
          title: 'Item Ready',
          description: `Item is ready for Bay ${lastMessage.data.bayNumber}`,
        });
        break;
        
      case 'item_delivered':
        // Refresh order data when an item is delivered
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
        queryClient.invalidateQueries({ queryKey: ['/api/order', lastMessage.data.orderId] });
        break;
        
      case 'order_updated':
        // Refresh order data when an order is updated
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
        queryClient.invalidateQueries({ queryKey: ['/api/order', lastMessage.data.id] });
        break;
    }
  }, [lastMessage, queryClient, orders, toast]);
  
  // Count orders by status
  const countByStatus = {
    all: orders?.length || 0,
    cooking: orders?.filter((o: OrderSummary) => o.status === OrderStatus.COOKING).length || 0,
    ready: orders?.filter((o: OrderSummary) => o.status === OrderStatus.READY).length || 0,
    delayed: orders?.filter((o: OrderSummary) => o.isDelayed).length || 0,
  };
  
  // Filter orders based on active tab
  const filteredOrders = orders?.filter((order: OrderSummary) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'delayed') return order.isDelayed;
    if (activeTab === 'cooking') return order.status === OrderStatus.COOKING;
    if (activeTab === 'ready') return order.status === OrderStatus.READY;
    return order.status.toLowerCase() === activeTab;
  }) || [];
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-poppins font-bold text-2xl text-primary">SwingEats Kitchen</h1>
          <p className="text-neutral-600">
            Active Orders: <span className="font-semibold">{countByStatus.all}</span> | 
            Delayed: <span className="font-semibold text-red-500">{countByStatus.delayed}</span> |
            Clock: <span className="font-semibold">{currentTime}</span>
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            <span>Print All</span>
          </Button>
          <Button variant="default" size="sm" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Alert Servers</span>
          </Button>
        </div>
      </div>
      
      {/* Order Priority Tabs */}
      <OrderPriorityTabs 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        counts={{
          all: countByStatus.all,
          cooking: countByStatus.cooking,
          ready: countByStatus.ready,
          delayed: countByStatus.delayed,
        }}
      />
      
      {/* Kitchen Order Grid */}
      {ordersLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, index) => (
            <Skeleton key={index} className="h-64" />
          ))}
        </div>
      ) : (
        <KitchenOrderGrid orders={filteredOrders} />
      )}
    </div>
  );
}
