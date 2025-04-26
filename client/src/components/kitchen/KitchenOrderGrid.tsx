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
  
  // Mark order as ready
  const markOrderAsReady = async (orderId: string) => {
    try {
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
    <div className="relative w-full">
      {/* Horizontal scrolling container with overflow shadows */}
      <div className="relative">
        {/* Left shadow gradient for scroll indication */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        
        {/* Right shadow gradient for scroll indication */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
        
        {/* Horizontal scrolling container */}
        <div className="flex overflow-x-auto pb-4 pt-1 px-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {orders.length === 0 ? (
            <div className="flex-shrink-0 w-full p-8 text-center text-neutral-500 bg-white rounded-md shadow-md">
              No orders in this category
            </div>
          ) : (
            <>
              {/* Sort orders to display by status: COOKING first, then NEW, then READY, etc. */}
              {orders
                .sort((a, b) => {
                  // Define order priority
                  const statusPriority: Record<string, number> = {
                    "COOKING": 1,
                    "NEW": 2,
                    "READY": 3,
                    "SERVED": 4,
                    "DINING": 5,
                    "PAID": 6,
                    "CANCELLED": 7
                  };
                  
                  return (statusPriority[a.status as keyof typeof statusPriority] || 99) - 
                         (statusPriority[b.status as keyof typeof statusPriority] || 99);
                })
                .map((order) => (
                <div key={order.id} className="flex-shrink-0 w-[350px] mr-4">
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
              ))}
            </>
          )}
        </div>
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
                "text-sm font-medium uppercase tracking-wider",
                order.status === "READY" ? "text-green-600" : 
                order.status === "COOKING" ? "text-amber-600" :
                order.status === "SERVED" ? "text-gray-600" :
                order.status === "DINING" ? "text-purple-600" :
                order.status === "PAID" ? "text-teal-600" :
                order.status === "CANCELLED" ? "text-red-600" :
                order.isDelayed ? "text-red-600" : "text-blue-600"
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
                    .sort((a, b) => (b.menuItem?.prep_seconds || 0) - (a.menuItem?.prep_seconds || 0))
                    .slice(0, 3)
                    .map((item, idx) => (
                      <div key={item.id} className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        idx === 0 ? "bg-blue-500 text-white" : 
                        idx === 1 ? "bg-blue-100 text-blue-800" : 
                        "bg-gray-100 text-gray-700"
                      )}>
                        {item.menuItem?.name?.substring(0, 15)}{item.menuItem?.name?.length > 15 ? '...' : ''} ({(() => {
                          const totalSeconds = item.menuItem?.prep_seconds || 0;
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
              Error loading items: {(error as Error).message}
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
                const aCookTime = a.menuItem?.prep_seconds || 0;
                const bCookTime = b.menuItem?.prep_seconds || 0;
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
                    .sort((a, b) => (b.menuItem?.prep_seconds || 0) - (a.menuItem?.prep_seconds || 0))[0]?.id === item.id &&
                    "border-2 border-blue-500 shadow-md",
                  // Add pulsing effect when an item is done cooking but not yet marked ready
                  item.status === "COOKING" && 
                    item.firedAt && 
                    (new Date().getTime() - new Date(item.firedAt).getTime()) / 1000 >= (item.menuItem?.prep_seconds || 0) &&
                    "border-2 border-green-500 shadow-md animate-pulse"
                )}
              >
                {/* Next Up Badge */}
                {item.status === "NEW" && 
                  orderDetails.items
                    .filter(i => i.status === "NEW")
                    .sort((a, b) => (b.menuItem?.prep_seconds || 0) - (a.menuItem?.prep_seconds || 0))[0]?.id === item.id && (
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
                              const cookingItemTotal = cookingItem.menuItem?.prep_seconds || 0;
                              const firedTime = new Date(cookingItem.firedAt).getTime();
                              const currentTime = new Date().getTime();
                              const elapsedSeconds = Math.floor((currentTime - firedTime) / 1000);
                              const remainingSeconds = Math.max(0, cookingItemTotal - elapsedSeconds);
                              
                              if (remainingSeconds < earliestReadyTime) {
                                earliestReadyTime = remainingSeconds;
                              }
                            }
                          });
                          
                          // Calculate when this pending item should be started to finish with the rest of the order
                          const pendingItemTotal = item.menuItem?.prep_seconds || 0;
                          
                          // If this item takes longer to cook than the remaining time on cooking items, 
                          // we should start it now
                          if (pendingItemTotal > earliestReadyTime) {
                            return (
                              <div className="absolute -top-2 right-2 bg-red-500 text-white px-2 py-0.5 text-xs font-bold rounded shadow-sm animate-pulse">
                                START NOW
                              </div>
                            );
                          }
                          
                          // Otherwise, we should start it after some delay to finish at the same time
                          const startInSeconds = earliestReadyTime - pendingItemTotal;
                          
                          // Format the start in time
                          if (startInSeconds <= 0) {
                            return (
                              <div className="absolute -top-2 right-2 bg-red-500 text-white px-2 py-0.5 text-xs font-bold rounded shadow-sm animate-pulse">
                                START NOW
                              </div>
                            );
                          } else if (startInSeconds < 60) {
                            // Start soon (less than a minute)
                            return (
                              <div className="absolute -top-2 right-2 bg-amber-500 text-white px-2 py-0.5 text-xs font-bold rounded shadow-sm">
                                START IN {startInSeconds}s
                              </div>
                            );
                          } else {
                            // Start in minutes
                            const minutes = Math.floor(startInSeconds / 60);
                            const seconds = startInSeconds % 60;
                            return (
                              <div className="absolute -top-2 right-2 bg-green-500 text-white px-2 py-0.5 text-xs font-bold rounded shadow-sm">
                                START IN {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                              </div>
                            );
                          }
                        })()}
                      </>
                    )
                }
                
                {/* "READY TO CHECK" badge for items that are done cooking */}
                {item.status === "COOKING" && 
                  item.firedAt && 
                  (new Date().getTime() - new Date(item.firedAt).getTime()) / 1000 >= (item.menuItem?.prep_seconds || 0) && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white px-2 py-0.5 text-xs font-bold rounded shadow-sm animate-pulse">
                      READY TO CHECK
                    </div>
                  )
                }
                
                <div className="flex-grow">
                  <div className="flex gap-3 items-center">
                    <Checkbox 
                      id={`item-${item.id}`}
                      className="h-5 w-5"
                      checked={item.status === "COOKING" || item.status === "READY"}
                      onCheckedChange={(checked) => {
                        toggleItemCompletion(item.id, checked as boolean, item.status || null);
                      }}
                    />
                    <div className="flex-grow">
                      <label 
                        htmlFor={`item-${item.id}`} 
                        className="flex justify-between cursor-pointer"
                      >
                        <div>
                          <span className="font-medium">
                            {item.menuItem?.name}
                          </span>
                          <div className="text-xs text-neutral-500">
                            {item.menuItem?.station} • {item.quantity > 1 ? `${item.quantity}x` : ''} {item.notes && 
                              <span className="italic text-gray-500">({item.notes})</span>
                            }
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Cook timer for COOKING items */}
                {item.status === "COOKING" && item.firedAt && (
                  <div className="ml-2 flex flex-col items-end">
                    {/* Display remaining time if firing in progress */}
                    {(() => {
                      const cookSeconds = item.menuItem?.prep_seconds || 0;
                      if (cookSeconds > 0) {
                        const firedTime = new Date(item.firedAt).getTime();
                        const elapsedSeconds = Math.floor((currentTime - firedTime) / 1000);
                        const remainingSeconds = Math.max(0, cookSeconds - elapsedSeconds);
                        
                        // Format the time
                        const minutes = Math.floor(remainingSeconds / 60);
                        const seconds = remainingSeconds % 60;
                        const timeDisplay = `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
                        
                        let bgColorClass = "";
                        let textColorClass = "";
                        
                        // Determine color based on remaining time
                        if (remainingSeconds === 0) {
                          // Done cooking
                          bgColorClass = "bg-green-100";
                          textColorClass = "text-green-800";
                        } else if (remainingSeconds < 30) {
                          // Almost done (less than 30 seconds)
                          bgColorClass = "bg-green-100";
                          textColorClass = "text-green-800";
                        } else if (remainingSeconds < 60) {
                          // Getting close (less than a minute)
                          bgColorClass = "bg-amber-100";
                          textColorClass = "text-amber-800";
                        } else {
                          // Still cooking
                          bgColorClass = "bg-blue-100";
                          textColorClass = "text-blue-800";
                        }
                        
                        return (
                          <div className={`flex items-center ${remainingSeconds === 0 ? 'animate-pulse' : ''}`}>
                            <TimerPill
                              value={timeDisplay}
                              bgColorClass={bgColorClass}
                              textColorClass={textColorClass}
                            />
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-2 bg-white rounded-md text-center text-neutral-400">
              No items in this order
            </div>
          )}
        </div>
        
        {/* Action button to mark order as ready */}
        {orderDetails?.status === "COOKING" && 
         orderDetails.items?.every(item => item.status === "READY") && (
          <div className="mt-4">
            <button
              onClick={() => markOrderAsReady(order.id)}
              className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Mark Order as Ready
            </button>
          </div>
        )}
      </div>
    </div>
  );
}