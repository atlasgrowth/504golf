import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import BaySelection from "./BaySelection";
import ActiveOrdersTable from "./ActiveOrdersTable";
import SimpleOrderDrawer from "./SimpleOrderDrawer";
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
  const [drawer, setDrawer] = useState<{ open: boolean, bayId: number | null }>({ open: false, bayId: null });
  const [statusFilter, setStatusFilter] = useState("COMPLETE"); // Default to COMPLETE tab to see past orders

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
    const orderStatus = order.status.toUpperCase();
    
    // Special filters for completed/delivered orders
    // For delivered tab (formerly served)
    if (statusFilter === 'DELIVERED') {
      return orderStatus === 'SERVED';
    }
    
    // For the combined completed orders tab
    if (statusFilter === 'COMPLETE') {
      return ['SERVED', 'DINING', 'PAID'].includes(orderStatus);
    }
    
    // For all other tabs, exclude completed orders
    if (['SERVED', 'DINING', 'PAID'].includes(orderStatus)) {
      return false;
    }
    
    // Special filter for delayed orders
    if (statusFilter === 'DELAYED') {
      return order.isDelayed;
    }
    
    // For PENDING tab, show both NEW and PENDING orders
    if (statusFilter === 'PENDING') {
      return orderStatus === 'PENDING' || orderStatus === 'NEW';
    }
    
    // For ALL tab, show all active orders except completed ones
    if (statusFilter === 'ALL') {
      return !['SERVED', 'DINING', 'PAID', 'CANCELLED'].includes(orderStatus);
    }
    
    // Default: match by status
    return orderStatus === statusFilter;
  });

  const toggleNewOrderDrawer = () => {
    console.log("Opening new order drawer");
    setDrawer({ open: !drawer.open, bayId: null });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-md border-l-4 border-primary">
        <div>
          <h1 className="font-poppins font-bold text-3xl text-primary">Five O Four Golf</h1>
          <p className="text-neutral-600 mt-1">Server: <span className="font-semibold text-neutral-800">{serverName}</span></p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            className="px-4 py-2.5 bg-white border border-neutral-300 rounded-lg flex items-center text-neutral-700 hover:bg-neutral-50 transition-colors shadow-sm"
            onClick={() => alert("Alert view not implemented yet")}
          >
            <Bell className="h-4 w-4 mr-2" />
            <span>Alerts</span>
            {alertCount > 0 && (
              <span className="ml-2 bg-danger text-white text-xs px-2 py-0.5 rounded-full">{alertCount}</span>
            )}
          </button>
          <button 
            className="px-4 py-2.5 bg-primary text-white rounded-lg flex items-center hover:brightness-110 transition-all shadow-md"
            onClick={toggleNewOrderDrawer}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>New Order</span>
          </button>
        </div>
      </div>
      
      {/* Bay Selection */}
      <BaySelection 
        onBayClick={(bayId) => setDrawer({ open: true, bayId })}
      />
      
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
      
      {/* New Order Drawer */}
      <SimpleOrderDrawer 
        open={drawer.open} 
        onOpenChange={(open) => setDrawer({ ...drawer, open })} 
        bayId={drawer.bayId}
      />
    </div>
  );
}
