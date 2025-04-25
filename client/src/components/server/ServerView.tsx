import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import BaySelection from "./BaySelection";
import ActiveOrdersTable from "./ActiveOrdersTable";
import ServerOrderDialog from "./ServerOrderDialog";
import BayTabs from "./BayTabs";
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
  const [statusFilter, setStatusFilter] = useState("READY"); // Default to READY tab

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

  // Handle tab change and filter orders based on status
  const handleTabChange = (tab: string) => {
    setStatusFilter(tab);
  };

  // Filter orders based on the selected tab
  const filteredOrders = orders.filter(order => {
    // For the SERVED tab, show only served orders
    if (statusFilter === 'SERVED') {
      return order.status.toUpperCase() === 'SERVED' || order.status === 'served';
    }
    
    // For all other tabs, exclude served orders
    if (order.status.toUpperCase() === 'SERVED' || order.status === 'served') {
      return false;
    }
    
    if (statusFilter === 'DELAYED') return order.isDelayed;
    return order.status.toUpperCase() === statusFilter;
  });

  const toggleNewOrderDialog = () => {
    console.log("Opening new order dialog");
    setNewOrderDialogOpen(!newOrderDialogOpen);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-poppins font-bold text-2xl text-primary">SwingEats</h1>
          <p className="text-neutral-600">Server: <span className="font-medium">{serverName}</span></p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            className="px-3 py-2 bg-white border border-neutral-300 rounded-md flex items-center text-neutral-700"
            onClick={() => alert("Alert view not implemented yet")}
          >
            <Bell className="h-4 w-4 mr-2" />
            <span>Alerts</span>
            {alertCount > 0 && (
              <span className="ml-2 bg-danger text-white text-xs px-1.5 rounded-full">{alertCount}</span>
            )}
          </button>
          <button 
            className="px-3 py-2 bg-primary text-white rounded-md flex items-center"
            onClick={toggleNewOrderDialog}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>New Order</span>
          </button>
        </div>
      </div>
      
      {/* Bay Selection */}
      <BaySelection />
      
      {/* Status Tabs and Active Orders Table */}
      {ordersLoading ? (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="font-poppins font-semibold text-lg mb-4">Active Orders</h2>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <div>
          {/* Status filter tabs */}
          <BayTabs orders={orders} onTabChange={handleTabChange} />
          
          {/* Table with filtered orders */}
          <ActiveOrdersTable orders={filteredOrders} statusFilter={statusFilter} />
        </div>
      )}
      
      {/* New Order Dialog - conditionally render instead of using open prop */}
      {newOrderDialogOpen && (
        <ServerOrderDialog 
          open={newOrderDialogOpen} 
          onOpenChange={setNewOrderDialogOpen} 
        />
      )}
    </div>
  );
}
