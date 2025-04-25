import { useState } from "react";
import { OrderStatusBadge } from "@/components/ui/order-status-badge";
import { TimerBadge } from "@/components/ui/timer-badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OrderSummary } from "@shared/schema";

interface ActiveOrdersTableProps {
  orders: OrderSummary[];
}

export default function ActiveOrdersTable({ orders }: ActiveOrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const { toast } = useToast();
  
  const handleViewDetails = (order: OrderSummary) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };
  
  const handleAlert = (order: OrderSummary) => {
    setSelectedOrder(order);
    setAlertOpen(true);
  };
  
  const markAsServed = async (orderId: number) => {
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
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>
                      <button className="p-1 text-neutral-600 hover:text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button 
                        className="p-1 text-neutral-600 hover:text-danger"
                        onClick={() => handleAlert(order)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
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
                <div className="flex justify-between">
                  <div className="text-sm font-medium">Total Items</div>
                  <div>{selectedOrder.totalItems}</div>
                </div>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Alert to Kitchen</DialogTitle>
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
    </div>
  );
}
