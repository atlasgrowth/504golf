import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { OrderStatusBadge } from "@/components/ui/order-status-badge";
import { ElapsedClock } from "@/components/ui/ElapsedClock";
import { EstimatedTimeDisplay } from "@/components/ui/estimated-time-display";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { OrderSummary, OrderWithItems } from "@shared/schema";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Utensils, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActiveOrdersTableProps {
  orders: OrderSummary[];
  statusFilter?: string;
}

export default function ActiveOrdersTable({ orders, statusFilter }: ActiveOrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const { toast } = useToast();
  
  // Get order details with items
  const { data: orderDetails, isLoading: isLoadingDetails } = useQuery<OrderWithItems | null>({
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
  
  const markAsServed = async (orderId: string) => {
    try {
      await changeStatus(orderId, 'SERVED');
      
      toast({
        title: "Delivered!",
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
  
  // Generic function to change order status
  const changeStatus = async (orderId: string, newStatus: string) => {
    try {
      await apiRequest('PUT', `/api/order/${orderId}/status`, { status: newStatus.toLowerCase() });
      
      // Status-specific toasts
      if (newStatus === 'DINING') {
        toast({
          title: "Status Updated",
          description: "Order has been marked as dining.",
          className: "bg-purple-100 border-purple-500"
        });
      } else if (newStatus === 'PAID') {
        toast({
          title: "Payment Complete",
          description: "Order has been marked as paid.",
          className: "bg-teal-100 border-teal-500"
        });
      }
      
      return true;
    } catch (error) {
      console.error("Error changing status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update order to ${newStatus.toLowerCase()} status.`,
      });
      return false;
    }
  };
  
  // Helper to determine status display
  const getOrderStatus = (order: OrderSummary) => {
    if (order.isDelayed) return "delayed";
    
    // Convert status to lowercase to match our statusConfig keys
    const status = order.status.toLowerCase();
    
    // Map to our known statuses
    if (status === 'new' || status === 'pending') return 'pending';
    if (status === 'cooking' || status === 'preparing') return 'cooking';
    if (status === 'ready') return 'ready';
    if (status === 'served') return 'served';
    if (status === 'dining') return 'dining';
    if (status === 'paid') return 'paid';
    if (status === 'cancelled') return 'cancelled';
    
    return status;
  };
  
  // Helper to determine row styling based on order status
  const getRowClass = (order: OrderSummary) => {
    const status = order.status.toUpperCase();
    
    if (status === "SERVED") {
      return "border-l-4 border-gray-400 opacity-70"; // Served orders are dimmed
    } else if (status === "DINING") {
      return "border-l-4 border-purple-400"; // Dining orders have purple border
    } else if (status === "PAID") {
      return "border-l-4 border-teal-400 opacity-70"; // Paid orders are dimmed with teal border
    }
    
    if (order.isDelayed) {
      return "animate-pulse border-l-4 border-red-500";
    }
    
    if (status === "NEW" || status === "COOKING") {
      return "border-l-4 border-blue-400";
    } else if (status === "READY") {
      return "border-l-4 border-green-500";
    }
    
    return "";
  };
  
  // Determine the title based on the status filter
  const getTableTitle = (): string => {
    if (statusFilter === "COMPLETE" || statusFilter === "SERVED" || statusFilter === "DINING" || statusFilter === "PAID") {
      return "Completed Orders";
    }
    return "Active Orders";
  };

  return (
    <div className="fiveofour-card p-4">
      <h2 className="font-poppins font-semibold text-lg mb-4">{getTableTitle()}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Bay</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Order ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Items</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Est. Ready</th>
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
                <tr key={order.id} className={getRowClass(order)}>
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
                    <ElapsedClock 
                      createdAt={order.createdAt}
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {order.status.toUpperCase() === 'COOKING' || order.status.toUpperCase() === 'PENDING' || order.status.toUpperCase() === 'NEW' ? (
                      <EstimatedTimeDisplay 
                        estimatedCompletionTime={order.estimatedCompletionTime}
                        showLabel={false}
                      />
                    ) : order.status.toUpperCase() === 'READY' ? (
                      <span className="text-sm font-medium text-green-600">Ready now</span>
                    ) : (
                      <span className="text-sm font-medium text-neutral-400">—</span>
                    )}
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
                      {/* Contextual action buttons based on order status */}
                      {order.status.toUpperCase() === 'READY' ? (
                        <button 
                          className="p-1 text-success hover:text-primary"
                          onClick={() => markAsServed(order.id)}
                          title="Serve Order"
                        >
                          <Utensils size={16} />
                        </button>
                      ) : order.status.toUpperCase() === 'SERVED' ? (
                        <button 
                          className="p-1 text-purple-500 hover:text-primary"
                          onClick={() => changeStatus(order.id, 'DINING')}
                          title="Mark as Dining"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                            <line x1="6" y1="1" x2="6" y2="4"></line>
                            <line x1="10" y1="1" x2="10" y2="4"></line>
                            <line x1="14" y1="1" x2="14" y2="4"></line>
                          </svg>
                        </button>
                      ) : order.status.toUpperCase() === 'DINING' ? (
                        <button 
                          className="p-1 text-teal-500 hover:text-primary"
                          onClick={() => changeStatus(order.id, 'PAID')}
                          title="Mark as Paid"
                        >
                          <DollarSign size={16} />
                        </button>
                      ) : (
                        <button className="p-1 text-neutral-400 cursor-not-allowed" title={`Cannot progress - ${order.status} state`}>
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
              
              <div className="flex justify-between">
                <div>
                  <div className="text-sm text-neutral-500">Time Elapsed</div>
                  <div className="font-medium">
                    <ElapsedClock createdAt={selectedOrder.createdAt} />
                  </div>
                </div>
                
                {(selectedOrder.status.toUpperCase() === 'COOKING' || 
                  selectedOrder.status.toUpperCase() === 'PENDING' || 
                  selectedOrder.status.toUpperCase() === 'NEW') && (
                  <div>
                    <div className="text-sm text-neutral-500">Est. Ready In</div>
                    <div className="font-medium text-center">
                      <EstimatedTimeDisplay 
                        estimatedCompletionTime={selectedOrder.estimatedCompletionTime}
                        showLabel={false}
                      />
                    </div>
                  </div>
                )}
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
                {selectedOrder.status.toUpperCase() === 'READY' ? (
                  <Button 
                    onClick={() => markAsServed(selectedOrder.id)}
                    className="bg-primary hover:bg-primary-dark"
                  >
                    Mark as Served
                  </Button>
                ) : selectedOrder.status.toUpperCase() === 'SERVED' ? (
                  <Button 
                    onClick={() => changeStatus(selectedOrder.id, 'DINING')}
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    Mark as Dining
                  </Button>
                ) : selectedOrder.status.toUpperCase() === 'DINING' ? (
                  <Button 
                    onClick={() => changeStatus(selectedOrder.id, 'PAID')}
                    className="bg-teal-500 hover:bg-teal-600"
                  >
                    Mark as Paid
                  </Button>
                ) : null}
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
      
      {/* One-click serving - no ServerFlowDialog needed */}
    </div>
  );
}
