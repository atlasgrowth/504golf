import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import BaySelection from "./BaySelection";
import ActiveOrdersTable from "./ActiveOrdersTable";
import ServerOrderDialog from "./ServerOrderDialog";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderSummary } from "@shared/schema";

export default function ServerView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { lastMessage } = useWebSocket();
  const [serverName, setServerName] = useState("Alex Johnson");
  const [newOrderDialogOpen, setNewOrderDialogOpen] = useState(false);

  // Get active orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery<OrderSummary[]>({
    queryKey: ['/api/orders'],
  });

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage?.type === 'ordersUpdate') {
      const ordersData = lastMessage.data as OrderSummary[];
      queryClient.setQueryData(['/api/orders'], ordersData);
      
      // Check for new orders and notify
      if (orders && ordersData.length > orders.length) {
        toast({
          title: 'New Order Received',
          description: `A new order has been placed.`,
        });
      }
    }
  }, [lastMessage, queryClient, orders, toast]);

  // Count alerts/flagged orders
  const alertCount = orders.filter(order => order.isDelayed).length || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-poppins font-bold text-2xl text-primary">SwingEats</h1>
          <p className="text-neutral-600">Server: <span className="font-medium">{serverName}</span></p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            className="flex items-center"
          >
            <Bell className="h-4 w-4 mr-2" />
            <span>Alerts</span>
            {alertCount > 0 && (
              <span className="ml-2 bg-danger text-white text-xs px-1.5 rounded-full">{alertCount}</span>
            )}
          </Button>
          <Button 
            className="bg-primary hover:bg-primary-dark flex items-center"
            onClick={() => setNewOrderDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>New Order</span>
          </Button>
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
        <ActiveOrdersTable orders={orders} />
      )}
      
      {/* New Order Dialog */}
      <ServerOrderDialog 
        open={newOrderDialogOpen} 
        onOpenChange={setNewOrderDialogOpen} 
      />
    </div>
  );
}
