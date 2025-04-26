import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TimerPill } from "@/components/ui/timer-badge";
import { TimerDisplay } from "@/components/ui/timer-display";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { OrderSummary, OrderWithItems } from "@shared/schema";

interface KitchenOrderGridProps {
  orders: OrderSummary[];
}

export default function KitchenOrderGrid({ orders }: KitchenOrderGridProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Clock state for live updates to timer displays
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Update the clock every second to keep timers refreshed
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    
    // Clean up interval on component unmount
    return () => clearInterval(timerInterval);
  }, []);
  
  // Refresh order data every 15 seconds to match server-side behavior
  useEffect(() => {
    const dataRefreshInterval = setInterval(() => {
      // Refetch orders data
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
      // Also refresh any detailed order data
      orders.forEach(order => {
        queryClient.invalidateQueries({ queryKey: ['/api/order', order.id] });
      });
      
      console.log('Refreshed kitchen order data');
    }, 15000); // Refresh every 15 seconds
    
    // Clean up interval on component unmount
    return () => clearInterval(dataRefreshInterval);
  }, [orders, queryClient]);
  
  // Helper function to determine order card style
  const getOrderCardStyle = (order: OrderSummary) => {
    // First check status
    if (order.status === "READY") {
      return "bg-green-50 border border-green-200 shadow-md";
    } else if (order.status === "COOKING") {
      return "bg-amber-50 border border-amber-200 shadow-md";
    } else if (order.status === "PENDING" || order.status === "NEW") {
      return "bg-blue-50 border border-blue-200 shadow-md";
    } else if (order.status === "SERVED") {
      return "bg-gray-50 border border-gray-300 shadow-md";
    } else if (order.status === "DINING") {
      return "bg-purple-50 border border-purple-200 shadow-md";
    } else if (order.status === "PAID") {
      return "bg-teal-50 border border-teal-200 shadow-md";
    } else if (order.status === "CANCELLED") {
      return "bg-red-50 border border-red-300 shadow-md";
    }
    
    // If no status match, fall back to time/delay based styling
    if (order.isDelayed) {
      return "bg-red-50 border border-red-200 shadow-md";
    } else if (order.timeElapsed > 15) {
      return "bg-amber-50 border border-amber-200 shadow-md";
    } else {
      return "bg-white border border-gray-200 shadow-sm";
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
  
  // Toggle item status between NEW -> COOKING -> READY
  const toggleItemCompletion = async (orderItemId: string, completed: boolean, currentStatus?: string | null) => {
    try {
      let endpoint;
      let actionTitle;
      
      // If user checks box:
      //   NEW   -> fire  ✅
      //   COOKING -> ready ✅
      // If user un-checks a READY item -> fire again (back to cooking)
      if (completed) {
        if (currentStatus === "COOKING") {
          endpoint = "/ready";
          actionTitle = "Item Ready";
        } else {
          endpoint = "/fire";
          actionTitle = "Item Fired";
        }
      } else {
        endpoint = "/fire";
        actionTitle = "Item Fired";
      }
      
      await apiRequest("POST", `/api/order-items/${orderItemId}${endpoint}`);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/order'] });
      
      toast({
        title: actionTitle,
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
  
  // Mark order as ready - but only if all items are completed
  const markOrderAsReady = async (orderId: string) => {
    try {
      // First fetch the order to check if all items are completed
      const response = await apiRequest("GET", `/api/order/${orderId}`);
      const orderData = await response.json() as OrderWithItems;
      
      // Check if any items are not completed
      const hasUncompletedItems = orderData.items.some(
        item => !item.completed && item.status !== "READY"
      );
      
      if (hasUncompletedItems) {
        toast({
          title: "Cannot mark as ready",
          description: "All items must be completed before marking the order as ready.",
          variant: "destructive",
        });
        return;
      }
      
      // If all items are complete, mark the order as ready
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
    <div className="relative">
      {/* Left scroll button */}
      <button 
        className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => {
          const container = document.getElementById('orders-scroll-container');
          if (container) {
            container.scrollBy({ left: -300, behavior: 'smooth' });
          }
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      {/* Right scroll button */}
      <button 
        className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => {
          const container = document.getElementById('orders-scroll-container');
          if (container) {
            container.scrollBy({ left: 300, behavior: 'smooth' });
          }
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      
      <div 
        id="orders-scroll-container"
        className="flex overflow-x-auto pb-4 pt-2 px-10 gap-4 snap-x scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
        style={{ scrollbarWidth: 'thin' }}
      >
        {orders.length === 0 ? (
          <div className="flex-shrink-0 min-w-full p-8 text-center text-neutral-500 bg-white rounded-md shadow-md">
            No orders in this category
          </div>
        ) : (
          // Sort orders: COOKING/PENDING first, then READY, then SERVED/DINING/PAID
          [...orders].sort((a, b) => {
            // Define status priority (lower number = appears more to the left)
            const statusPriority: Record<string, number> = {
              "NEW": 0,
              "PENDING": 1,
              "COOKING": 2,
              "READY": 10,
              "SERVED": 20,
              "DINING": 30,
              "PAID": 40,
              "CANCELLED": 50
            };
            
            // Get priority values (default to high number if not found)
            const aPriority = statusPriority[a.status] ?? 100;
            const bPriority = statusPriority[b.status] ?? 100;
            
            // Sort by priority
            return aPriority - bPriority;
          }).map((order) => (
            <div key={order.id} className="flex-shrink-0 w-80 snap-start">
              <OrderCard 
                order={order}
                getOrderCardStyle={getOrderCardStyle}
                getTimeStatusText={getTimeStatusText}
                getTimeStatusColor={getTimeStatusColor}
                toggleItemCompletion={toggleItemCompletion}
                markOrderAsReady={markOrderAsReady}
                currentTime={currentTime}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Separate component for each order card to properly use hooks
function OrderCard({ 
  order, 
  getOrderCardStyle,
  getTimeStatusText,
  getTimeStatusColor,
  toggleItemCompletion,
  markOrderAsReady,
  currentTime
}: { 
  order: OrderSummary;
  getOrderCardStyle: (order: OrderSummary) => string;
  getTimeStatusText: (order: OrderSummary) => string;
  getTimeStatusColor: (order: OrderSummary) => string;
  toggleItemCompletion: (orderItemId: string, completed: boolean, currentStatus?: string | null) => Promise<void>;
  markOrderAsReady: (orderId: string) => Promise<void>;
  currentTime: number;
}) {
  // Now we can use hooks properly in this component
  const { data: orderDetails, isLoading, error } = useQuery<OrderWithItems | null>({
    queryKey: ["/api/order", order.id],
    queryFn: async () => {
      try {
        console.log(`Fetching order details for order ${order.id}`);
        const response = await apiRequest("GET", `/api/order/${order.id}`);
        const data = await response.json();
        return data as OrderWithItems;
      } catch (error) {
        console.error(`Error fetching order details for ${order.id}:`, error);
        return null;
      }
    },
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  
  return (
    <div 
      className={cn(
        "rounded-md shadow-md",
        getOrderCardStyle(order)
      )}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center mb-1">
              <div className={cn(
                "w-2 h-2 rounded-full mr-2",
                order.status === "READY" ? "bg-green-500" : 
                order.status === "COOKING" ? "bg-amber-500" :
                order.status === "SERVED" ? "bg-gray-500" :
                order.status === "DINING" ? "bg-purple-500" :
                order.status === "PAID" ? "bg-teal-500" :
                order.status === "CANCELLED" ? "bg-red-500" :
                order.isDelayed ? "bg-red-500" : "bg-blue-500"
              )}></div>
              <span className={cn(
                "text-sm font-medium uppercase tracking-wider px-2 py-0.5 rounded",
                order.status === "READY" ? "text-green-700 bg-green-50 border border-green-200" : 
                order.status === "COOKING" ? "text-amber-700 bg-amber-50 border border-amber-200" :
                order.status === "SERVED" ? "text-gray-700 bg-gray-50 border border-gray-200" :
                order.status === "DINING" ? "text-purple-700 bg-purple-50 border border-purple-200" :
                order.status === "PAID" ? "text-teal-700 bg-teal-50 border border-teal-200" :
                order.status === "CANCELLED" ? "text-red-700 bg-red-50 border border-red-200" :
                order.isDelayed ? "text-red-700 bg-red-50 border border-red-200" : "text-blue-700 bg-blue-50 border border-blue-200"
              )}>
                {order.status}
              </span>
              {order.isDelayed && (
                <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                  DELAYED
                </span>
              )}
            </div>
            <div className="flex items-center mb-1">
              <span className="text-sm font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md mr-2">
                #{order.orderNumber}
              </span>
              <h3 className="font-poppins font-bold text-lg">Bay {order.bayNumber}</h3>
              <span className="ml-1 text-sm text-neutral-500">(Floor {order.floor})</span>
            </div>
            <p className="text-xs text-neutral-500 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Placed&nbsp;
              {new Date(order.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <TimerDisplay createdAt={order.createdAt} isDelayed={order.isDelayed} />
            <span className={cn(
              "mt-1 text-xs font-medium px-2 py-0.5 rounded-full",
              order.isDelayed 
                ? "bg-red-100 text-red-800" 
                : order.timeElapsed > 15 
                  ? "bg-amber-100 text-amber-800" 
                  : "bg-green-100 text-green-800"
            )}>
              {getTimeStatusText(order)}
            </span>
          </div>
        </div>
        
        <div className="mt-4 space-y-2">
          {/* Order Sequence Timer */}
          {!isLoading && !error && orderDetails?.items && orderDetails.items.some(i => i.status === "NEW" || i.status === "COOKING") && (
            <div className="mb-3 p-2 bg-blue-50 border border-blue-100 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-medium text-blue-700">Cook Time Priority:</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-1.5">
                  {orderDetails.items
                    .filter(i => i.status === "NEW" || i.status === "COOKING")
                    .sort((a, b) => (b.menuItem?.prepSeconds || 0) - (a.menuItem?.prepSeconds || 0))
                    .slice(0, 3)
                    .map((item, idx) => (
                      <div key={item.id} className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        idx === 0 ? "bg-blue-500 text-white" : 
                        idx === 1 ? "bg-blue-100 text-blue-800" : 
                        "bg-gray-100 text-gray-700"
                      )}>
                        {item.menuItem?.name?.substring(0, 15)}{item.menuItem?.name?.length > 15 ? '...' : ''} ({(() => {
                          const totalSeconds = item.menuItem?.prepSeconds || 0;
                          const minutes = Math.floor(totalSeconds / 60);
                          return minutes === 0 && totalSeconds > 0 ? 1 : minutes;
                        })()}m)
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}

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
            // Sort items by cook time (longer cook times first) and then by status
            [...orderDetails.items]
              .sort((a, b) => {
                // First sort by status priority: NEW > COOKING > READY
                const statusPriority: Record<string, number> = { "NEW": 0, "PENDING": 1, "COOKING": 2, "READY": 3 };
                const aStatus = a.status || "PENDING";
                const bStatus = b.status || "PENDING";
                const statusDiff = (statusPriority[aStatus] || 0) - (statusPriority[bStatus] || 0);
                
                if (statusDiff !== 0) return statusDiff;
                
                // Then sort by cook time (descending)
                const aCookTime = a.menuItem?.prepSeconds || 0;
                const bCookTime = b.menuItem?.prepSeconds || 0;
                return bCookTime - aCookTime;
              })
              .map((item) => (
              <div 
                key={item.id} 
                className={cn(
                  "flex justify-between p-3 rounded-md mb-2 border relative",
                  item.status === "READY" 
                    ? "bg-green-50 border-green-200" 
                    : item.status === "COOKING" 
                      ? "bg-amber-50 border-amber-200" 
                      : "bg-white border-gray-200",
                  item.status === "READY" && "border-l-4 border-l-green-500",
                  // Add a highlighted border for the next item to cook (the pending item with longest prep time)
                  item.status === "NEW" && 
                  orderDetails.items
                    .filter(i => i.status === "NEW")
                    .sort((a, b) => (b.menuItem?.prepSeconds || 0) - (a.menuItem?.prepSeconds || 0))[0]?.id === item.id &&
                    "border-2 border-blue-500 shadow-md",
                  // Add pulsing effect when an item is done cooking but not yet marked ready
                  item.status === "COOKING" && 
                    item.firedAt && 
                    (new Date().getTime() - new Date(item.firedAt).getTime()) / 1000 >= (item.menuItem?.prepSeconds || 0) &&
                    "border-2 border-green-500 shadow-md animate-pulse"
                )}
              >
                {/* Next Up Badge */}
                {item.status === "NEW" && 
                  orderDetails.items
                    .filter(i => i.status === "NEW")
                    .sort((a, b) => (b.menuItem?.prepSeconds || 0) - (a.menuItem?.prepSeconds || 0))[0]?.id === item.id && (
                      <>
                        <div className="absolute -top-2 -left-2 bg-blue-500 text-white px-2 py-0.5 text-xs font-bold rounded shadow-sm">
                          NEXT UP
                        </div>
                        
                        {/* Add a "Start In" timer that calculates when to start this item */}
                        {(() => {
                          // Find currently cooking items in this order
                          const cookingItems = orderDetails.items.filter(i => i.status === "COOKING" && i.firedAt);
                          
                          // If no cooking items, show "START NOW"
                          if (cookingItems.length === 0) {
                            return (
                              <div className="absolute -top-2 right-2 bg-red-500 text-white px-2 py-0.5 text-xs font-bold rounded shadow-sm animate-pulse">
                                START NOW
                              </div>
                            );
                          }
                          
                          // Calculate the soonest an item will be done cooking
                          let earliestReadyTime = Infinity;
                          cookingItems.forEach(cookingItem => {
                            if (cookingItem.firedAt) {
                              const cookingItemTotal = cookingItem.menuItem?.prepSeconds || 0;
                              const firedTime = new Date(cookingItem.firedAt).getTime();
                              const currentTime = new Date().getTime();
                              const elapsedSeconds = Math.floor((currentTime - firedTime) / 1000);
                              const remainingSeconds = Math.max(0, cookingItemTotal - elapsedSeconds);
                              
                              // Update earliestReadyTime if this item will be ready sooner
                              if (remainingSeconds < earliestReadyTime) {
                                earliestReadyTime = remainingSeconds;
                              }
                            }
                          });
                          
                          // Calculate when we should start cooking the next item
                          const nextItemPrepSeconds = item.menuItem?.prepSeconds || 0;
                          
                          // Determine if we should start now or wait
                          // If the next item takes longer than the current cooking items, start now
                          // Otherwise, wait until [earliestReadyTime - nextItemPrepSeconds]
                          const startInSeconds = Math.max(0, earliestReadyTime - nextItemPrepSeconds);
                          
                          // Format the start time
                          const minutes = Math.floor(startInSeconds / 60);
                          const seconds = startInSeconds % 60;
                          
                          if (startInSeconds <= 0) {
                            // Should start now
                            return (
                              <div className="absolute -top-2 right-2 bg-red-500 text-white px-2 py-0.5 text-xs font-bold rounded shadow-sm animate-pulse">
                                START NOW
                              </div>
                            );
                          } else if (startInSeconds < 60) {
                            // Start soon (less than a minute)
                            return (
                              <div className="absolute -top-2 right-2 bg-amber-500 text-white px-2 py-0.5 text-xs font-bold rounded shadow-sm">
                                START IN {seconds}s
                              </div>
                            );
                          } else {
                            // Start later
                            return (
                              <div className="absolute -top-2 right-2 bg-green-600 text-white px-2 py-0.5 text-xs font-bold rounded shadow-sm">
                                START IN {minutes}:{seconds.toString().padStart(2, '0')}
                              </div>
                            );
                          }
                        })()}
                      </>
                )}
                
                <div className="flex items-center flex-1">
                  <div className="mr-2 flex-shrink-0">
                    {item.status === "READY" ? (
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : item.status === "COOKING" ? (
                      <Checkbox
                        className="w-6 h-6 data-[state=checked]:bg-green-500 border-amber-300 bg-amber-100"
                        checked={item.status === "READY"}
                        onCheckedChange={(checked) => toggleItemCompletion(item.id, checked as boolean, item.status || undefined)}
                      />
                    ) : (
                      <Checkbox
                        className="w-6 h-6 data-[state=checked]:bg-amber-500"
                        checked={item.status === "COOKING"}
                        onCheckedChange={(checked) => toggleItemCompletion(item.id, checked as boolean)}
                      />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center text-sm font-medium">
                      <span className="inline-block mr-1.5 truncate">{item.menuItem?.name || "Unknown Item"}</span>
                      {item.quantity > 1 && (
                        <span className="bg-neutral-100 px-1.5 py-0.5 text-xs rounded-full">
                          x{item.quantity}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center mt-1">
                      <div className="flex items-center">
                        {/* Calculate prep time minutes - add 1 if there are remaining seconds */}
                        {(() => {
                          const totalSeconds = item.menuItem?.prepSeconds || 0;
                          const minutes = Math.floor(totalSeconds / 60);
                          const displayMinutes = minutes === 0 && totalSeconds > 0 ? 1 : minutes;
                          return (
                            <>
                              <div className={cn(
                                "h-5 min-w-5 flex items-center justify-center rounded-full text-[10px] font-medium mr-1",
                                totalSeconds > 600 ? "bg-red-100 text-red-700 border border-red-200" :
                                totalSeconds > 300 ? "bg-amber-100 text-amber-700 border border-amber-200" : 
                                "bg-green-100 text-green-700 border border-green-200"
                              )}>
                                {displayMinutes}m
                              </div>
                              <span className="text-xs text-neutral-500 truncate">
                                {item.menuItem?.station || "Kitchen"}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-2 flex flex-col items-end">
                    <div className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium",
                      item.status === "READY" ? "bg-green-100 text-green-700" :
                      item.status === "COOKING" ? "bg-amber-100 text-amber-700" :
                      "bg-blue-100 text-blue-700"
                    )}>
                      {item.status === "READY" ? "READY" : 
                       item.status === "COOKING" ? "COOKING" : "PENDING"}
                    </div>
                    
                    {/* Show timing info */}
                    {item.firedAt && (
                      <div className="mt-1 text-[10px] text-neutral-500">
                        {item.status === "READY" ? (
                          <>Ready at: {new Date(item.firedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</>
                        ) : item.status === "COOKING" ? (
                          <>
                            {(() => {
                              // Calculate time elapsed since firing
                              const totalCookSeconds = item.menuItem?.prepSeconds || 0;
                              const firedTime = new Date(item.firedAt).getTime();
                              const currentTime = new Date().getTime();
                              const elapsedSeconds = Math.floor((currentTime - firedTime) / 1000);
                              
                              // Calculate remaining time
                              const remainingSeconds = Math.max(0, totalCookSeconds - elapsedSeconds);
                              const minutes = Math.floor(remainingSeconds / 60);
                              const seconds = remainingSeconds % 60;
                              
                              // Format display
                              if (remainingSeconds <= 0) {
                                return (
                                  <span className="font-semibold text-green-600">
                                    READY TO CHECK
                                  </span>
                                );
                              } else {
                                return (
                                  <span className={cn(
                                    "font-medium",
                                    remainingSeconds < 30 ? "text-green-600" : 
                                    remainingSeconds < 60 ? "text-amber-600" : 
                                    "text-neutral-600"
                                  )}>
                                    {minutes}:{seconds.toString().padStart(2, '0')} remaining
                                  </span>
                                );
                              }
                            })()}
                          </>
                        ) : (
                          <>Fired at: {new Date(item.firedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : null}
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className={cn(
                "text-sm font-medium",
                order.isDelayed ? "text-red-600" : "text-neutral-600"
              )}>
                {order.status === "READY" ? (
                  <span className="flex items-center text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Order Ready To Serve
                  </span>
                ) : (
                  <span>
                    {orderDetails?.items?.filter(i => i.status === "READY").length || 0} of {orderDetails?.items?.length || 0} items ready
                  </span>
                )}
              </span>
            </div>
            
            {order.status !== "READY" && (
              <button 
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium flex items-center shadow-sm transition-all",
                  order.isDelayed
                    ? "bg-red-500 hover:bg-red-600 text-white" 
                    : "bg-green-500 hover:bg-green-600 text-white"
                )}
                onClick={() => markOrderAsReady(order.id)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Mark Order Ready
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}