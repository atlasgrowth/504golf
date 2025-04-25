import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { OrderStatusBadge } from "@/components/ui/order-status-badge";
import { TimerBadge } from "@/components/ui/timer-badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { OrderSummary, OrderWithItems } from "@shared/schema";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ServerFlowDialog from "./ServerFlowDialog";
import { Utensils } from "lucide-react";

interface ActiveOrdersTableProps {
  orders: OrderSummary[];
}

export default function ActiveOrdersTable({ orders }: ActiveOrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [serveFlowOpen, setServeFlowOpen] = useState(false);
  const { toast } = useToast();
  
  // Get order details with items
  const { data: orderDetails, isLoading: isLoadingDetails, refetch: refetchOrderDetails } = useQuery<OrderWithItems | null>({
    queryKey: ["/api/order", selectedOrder?.id],
    queryFn: async () => {
      if (!selectedOrder) return null;
      try {
        console.log(`Fetching order details for order ${selectedOrder.id}`);
        const response = await apiRequest("GET", `/api/order/${selectedOrder.id}`);
        const data = await response.json();
        return data as OrderWithItems;
      } catch (error) {
        console.error(`Error fetching order details:`, error);
        return null;
      }
    },
    enabled: !!selectedOrder && !!selectedOrder.id,
  });
  
  const handleViewDetails = (order: OrderSummary) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };
  
  const handleAlert = (order: OrderSummary) => {
    setSelectedOrder(order);
    setAlertOpen(true);
  };
  
  const handleServeFlow = (order: OrderSummary) => {
    setSelectedOrder(order);
    setServeFlowOpen(true);
  };
  
  const markAsServed = async (orderId: string) => {
    try {
      await apiRequest('PUT', `/api/order/${orderId}/status`, { status: 'served' });
      setDetailsOpen(false);
      
      toast({
        title: "Order Updated",
        description: "Order has been marked as served.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive",
      });
    }
  };
  
  const handleServeFlowComplete = () => {
    setServeFlowOpen(false);
    
    toast({
      title: "Order Service Complete",
      description: "The order has been successfully served to the customer.",
    });
  };
  
  const sendAlert = async () => {
    if (!selectedOrder) return;
    
    try {
      // In a real system, this would notify the kitchen
      toast({
        title: "Alert Sent",
        description: `Alert sent to kitchen for order #${selectedOrder.orderNumber}.`,
      });
      setAlertOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send alert.",
        variant: "destructive",
      });
    }
  };
  
  // Helper to determine status display
  const getOrderStatus = (order: OrderSummary) => {
    if (order.isDelayed) return "delayed";
    return order.status;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="font-poppins font-semibold text-lg mb-4">Active Orders</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Bay</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Order ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Items</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  No active orders at this time
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-medium">Bay {order.bayNumber}</span>
                    <span className="block text-xs text-neutral-500">Floor {order.floor}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">#{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm">{order.totalItems} items</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <OrderStatusBadge status={getOrderStatus(order)} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <TimerBadge 
                      minutes={order.timeElapsed} 
                      isDelayed={order.isDelayed}
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button 
                        className="p-1 text-neutral-600 hover:text-primary"
                        onClick={() => handleViewDetails(order)}
                        title="View Details"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>
                      {/* Only show serve button for orders that are in READY status */}
                      {order.status === 'READY' || order.status === 'ready' ? (
                        <button 
                          className="p-1 text-success hover:text-primary"
                          onClick={() => handleServeFlow(order)}
                          title="Serve Order"
                        >
                          <Utensils size={16} />
                        </button>
                      ) : (
                        <button className="p-1 text-neutral-400 cursor-not-allowed" title="Cannot serve - not ready">
                          <Utensils size={16} />
                        </button>
                      )}
                      <button 
                        className="p-1 text-neutral-600 hover:text-danger"
                        onClick={() => handleAlert(order)}
                        title="Send Alert"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>View the complete details for this order</DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4 mt-2">
              <div className="flex justify-between">
                <div>
                  <div className="text-sm text-neutral-500">Order ID</div>
                  <div className="font-medium">#{selectedOrder.orderNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-500">Bay</div>
                  <div className="font-medium">Bay {selectedOrder.bayNumber} (Floor {selectedOrder.floor})</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-500">Status</div>
                  <OrderStatusBadge status={getOrderStatus(selectedOrder)} />
                </div>
              </div>
              
              <div>
                <div className="text-sm text-neutral-500">Time Elapsed</div>
                <div className={`font-medium ${selectedOrder.isDelayed ? 'text-danger' : ''}`}>
                  {selectedOrder.timeElapsed} minutes
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="mb-2">
                  <div className="text-sm font-medium mb-2">Order Items</div>
                  
                  {isLoadingDetails ? (
                    <div className="flex items-center justify-center p-4">
                      <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : orderDetails?.items && orderDetails.items.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {orderDetails.items.map((item) => (
                        <div 
                          key={item.id} 
                          className="flex justify-between p-2 bg-neutral-50 rounded-md"
                        >
                          <div className="flex-1">
                            <div className="font-medium">
                              {item.quantity}x {item.menuItem?.name || 'Unknown Item'}
                            </div>
                            <div className="text-xs text-neutral-500">
                              Station: {item.menuItem?.station || item.station || 'Unknown'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              ${((item.price_cents || item.menuItem?.price_cents || 0) / 100).toFixed(2)}
                            </div>
                            <div className="text-xs text-neutral-500">
                              {item.status || 'NEW'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-neutral-500 text-center p-4">
                      No items found
                    </div>
                  )}
                </div>
                
                {orderDetails?.specialInstructions && (
                  <div className="mb-2">
                    <div className="text-sm font-medium">Special Instructions</div>
                    <div className="text-sm italic bg-neutral-50 p-2 rounded-md">
                      {orderDetails.specialInstructions}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  Close
                </Button>
                <Button 
                  onClick={() => markAsServed(selectedOrder.id)}
                  className="bg-primary hover:bg-primary-dark"
                >
                  Mark as Served
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Alert Dialog */}
      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Alert to Kitchen</DialogTitle>
            <DialogDescription>Alert the kitchen staff about this order</DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4 mt-2">
              <p>
                Are you sure you want to send an alert to the kitchen for order 
                #{selectedOrder.orderNumber} at Bay {selectedOrder.bayNumber}?
              </p>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setAlertOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={sendAlert}
                  variant="destructive"
                >
                  Send Alert
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Server Flow Dialog */}
      {selectedOrder && (
        <ServerFlowDialog
          open={serveFlowOpen}
          onOpenChange={setServeFlowOpen}
          order={selectedOrder}
          orderDetails={orderDetails}
          isLoadingDetails={isLoadingDetails}
          onComplete={handleServeFlowComplete}
        />
      )}
    </div>
  );
}
