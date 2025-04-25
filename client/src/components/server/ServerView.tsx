import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import BaySelection from "./BaySelection";
import ActiveOrdersTable from "./ActiveOrdersTable";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function ServerView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { lastMessage } = useWebSocket();
  const [serverName, setServerName] = useState("Alex Johnson");

  // Get active orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders'],
  });

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

  // Count alerts/flagged orders
  const alertCount = orders?.filter(order => order.isDelayed).length || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-poppins font-bold text-2xl text-primary">SwingEats</h1>
          <p className="text-neutral-600">Server: <span className="font-medium">{serverName}</span></p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-3 py-2 bg-white border border-neutral-300 rounded-md flex items-center text-neutral-700">
            <i className="fas fa-bell mr-2"></i>
            <span>Alerts</span>
            {alertCount > 0 && (
              <span className="ml-2 bg-danger text-white text-xs px-1.5 rounded-full">{alertCount}</span>
            )}
          </button>
          <button className="px-3 py-2 bg-primary text-white rounded-md flex items-center">
            <i className="fas fa-plus mr-2"></i>
            <span>New Order</span>
          </button>
        </div>
      </div>
      
      {/* Bay Selection */}
      <BaySelection />
      
      {/* Active Orders Table */}
      {ordersLoading ? (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="font-poppins font-semibold text-lg mb-4">Active Orders</h2>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <ActiveOrdersTable orders={orders || []} />
      )}
    </div>
  );
}
