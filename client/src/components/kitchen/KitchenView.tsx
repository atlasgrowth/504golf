import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import OrderPriorityTabs from "./OrderPriorityTabs";
import KitchenOrderGrid from "./KitchenOrderGrid";
import { Skeleton } from "@/components/ui/skeleton";

export default function KitchenView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { lastMessage } = useWebSocket();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [currentTime, setCurrentTime] = useState<string>("");
  
  // Get active orders based on selected tab
  const endpoint = activeTab === "all" ? "/api/orders" : `/api/orders/${activeTab}`;
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: [endpoint],
  });
  
  // Update time every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage?.type === 'ordersUpdate') {
      queryClient.setQueryData(['/api/orders'], lastMessage.data);
      
      // Check for new orders and notify
      if (orders && lastMessage.data.length > orders.length) {
        toast({
          title: 'New Order Received',
          description: `A new order has been placed.`,
        });
      }
    }
  }, [lastMessage, queryClient, orders, toast]);
  
  // Count orders by status
  const countByStatus = {
    all: orders?.length || 0,
    preparing: orders?.filter(o => o.status === 'preparing').length || 0,
    ready: orders?.filter(o => o.status === 'ready').length || 0,
    delayed: orders?.filter(o => o.isDelayed).length || 0,
  };
  
  // Filter orders based on active tab
  const filteredOrders = orders?.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'delayed') return order.isDelayed;
    return order.status === activeTab;
  }) || [];
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-poppins font-bold text-2xl text-primary">SwingEats Kitchen</h1>
          <p className="text-neutral-600">
            Active Orders: <span className="font-semibold">{countByStatus.all}</span> | 
            Delayed: <span className="font-semibold text-danger">{countByStatus.delayed}</span>
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-neutral-700 font-medium">{currentTime}</span>
          <button className="px-3 py-2 bg-white border border-neutral-300 rounded-md flex items-center text-neutral-700">
            <i className="fas fa-print mr-2"></i>
            <span>Print All</span>
          </button>
          <button className="px-3 py-2 bg-primary text-white rounded-md flex items-center">
            <i className="fas fa-bell mr-2"></i>
            <span>Alert Servers</span>
          </button>
        </div>
      </div>
      
      {/* Order Priority Tabs */}
      <OrderPriorityTabs 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        counts={countByStatus}
      />
      
      {/* Kitchen Order Grid */}
      {ordersLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, index) => (
            <Skeleton key={index} className="h-64" />
          ))}
        </div>
      ) : (
        <KitchenOrderGrid orders={filteredOrders} />
      )}
    </div>
  );
}
