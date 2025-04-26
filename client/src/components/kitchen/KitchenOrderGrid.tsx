import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TimerPill } from "@/components/ui/timer-badge";
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
  
  // Helper function to determine order card style
  const getOrderCardStyle = (order: OrderSummary) => {
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
  
  // Load full order details - properly encapsulated inside a custom hook
  const useOrderDetails = (orderId: string) => {
    return useQuery<OrderWithItems | null>({
      queryKey: ["/api/order", orderId],
      queryFn: async () => {
        try {
          console.log(`Fetching order details for order ${orderId}`);
          const response = await apiRequest("GET", `/api/order/${orderId}`);
          console.log(`Order details response for ${orderId}:`, response);
          
          const data = await response.json();
          
          if (!data || !data.id) {
            console.error(`Order details response invalid for ${orderId}:`, data);
            return null;
          }
          
          return data as OrderWithItems;
        } catch (error) {
          console.error(`Error fetching order details for ${orderId}:`, error);
          return null;
        }
      },
      staleTime: 10_000,
      refetchOnWindowFocus: false,
      retry: 1, // Only retry once to avoid flooding the server with requests
    });
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {orders.length === 0 ? (
        <div className="col-span-3 p-8 text-center text-neutral-500 bg-white rounded-md shadow-md">
          No orders in this category
        </div>
      ) : (
        orders.map((order) => {
          const { data: orderDetails, isLoading, error } = useOrderDetails(order.id);
          
          console.log(`Order ${order.id} details:`, { orderDetails, isLoading, error });
          
          return (
            <div 
              key={order.id} 
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
                        order.isDelayed ? "bg-red-500" : "bg-blue-500"
                      )}></div>
                      <span className={cn(
                        "text-sm font-medium uppercase tracking-wider",
                        order.status === "READY" ? "text-green-600" : 
                        order.status === "COOKING" ? "text-amber-600" : 
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
                      &nbsp;—&nbsp;{order.timeElapsed} min ago
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <TimerPill minutes={order.timeElapsed} isDelayed={order.isDelayed} />
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
                  {!isLoading && !error && orderDetails?.items && orderDetails.items.some(i => i.status !== "READY") && (
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
                            .filter(i => i.status !== "READY")
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
                      Error loading items: {error.message}
                    </div>
                  ) : orderDetails?.items && orderDetails.items.length > 0 ? (
                    // Sort items by cook time (longer cook times first) and then by status
                    [...orderDetails.items]
                      .sort((a, b) => {
                        // First sort by status priority: NEW > COOKING > READY
                        const statusPriority = { "NEW": 0, "PENDING": 1, "COOKING": 2, "READY": 3 };
                        const statusDiff = (statusPriority[a.status as keyof typeof statusPriority] || 0) - 
                                           (statusPriority[b.status as keyof typeof statusPriority] || 0);
                        
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
                          item.status === "PENDING" && 
                          orderDetails.items
                            .filter(i => i.status === "PENDING")
                            .sort((a, b) => (b.menuItem?.prep_seconds || 0) - (a.menuItem?.prep_seconds || 0))[0]?.id === item.id &&
                            "border-2 border-blue-500 shadow-md"
                        )}
                      >
                        {/* Next Up Badge */}
                        {item.status === "PENDING" && 
                          orderDetails.items
                            .filter(i => i.status === "PENDING")
                            .sort((a, b) => (b.menuItem?.prep_seconds || 0) - (a.menuItem?.prep_seconds || 0))[0]?.id === item.id && (
                              <div className="absolute -top-2 -left-2 bg-blue-500 text-white px-2 py-0.5 text-xs font-bold rounded shadow-sm">
                                NEXT UP
                              </div>
                        )}
                        
                        <div className="flex items-center flex-1">
                          <div className="mr-2 flex-shrink-0">
                            {item.status === "READY" ? (
                              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            ) : item.status === "COOKING" ? (
                              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </div>
                            ) : (
                              <button
                                onClick={() => toggleItemCompletion(item.id, true, item.status)}
                                className="h-8 w-8 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-all transform hover:scale-105 shadow-sm"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className={cn(
                              "font-medium",
                              item.status === "READY" ? "text-green-700" : "text-neutral-800"
                            )}>
                              {item.quantity}x {item.menuItem?.name || 'Unknown Item'}
                            </span>
                            <div className="flex items-center text-xs">
                              <span className="text-neutral-500">
                                {item.menuItem?.station || item.station || 'Kitchen'}
                              </span>
                              
                              {/* Cook time indicator with visual complexity badge */}
                              <div className="flex items-center ml-2">
                                {/* Calculate prep time minutes - add 1 if there are remaining seconds */}
                                {(() => {
                                  const totalSeconds = item.menuItem?.prep_seconds || 0;
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
                                        <span className="px-1">{displayMinutes}</span>
                                      </div>
                                      <span className={cn(
                                        "font-medium text-[10px]",
                                        totalSeconds > 600 ? "text-red-600" :
                                        totalSeconds > 300 ? "text-amber-600" : 
                                        "text-green-600"
                                      )}>
                                        min cook time
                                      </span>
                                    </>
                                  )
                                })()}
                              </div>
                              
                              {/* For cooking items, show elapsed cooking time */}
                              {item.status === "COOKING" && item.firedAt && (
                                <>
                                  <span className="ml-2 bg-amber-100 text-amber-700 px-1 py-0.5 rounded text-[10px] font-medium">
                                    {Math.floor((currentTime - new Date(item.firedAt).getTime()) / 60000)} min elapsed
                                  </span>
                                  
                                  {/* Progress bar */}
                                  {item.menuItem?.prep_seconds && (
                                    <div className="ml-2 w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div 
                                        className={cn(
                                          "h-full rounded-full",
                                          ((currentTime - new Date(item.firedAt).getTime()) / 1000) > item.menuItem.prep_seconds
                                            ? "bg-red-500" // Overdue
                                            : "bg-green-500" // On time
                                        )}
                                        style={{
                                          width: `${Math.min(100, ((currentTime - new Date(item.firedAt).getTime()) / 1000 / item.menuItem.prep_seconds) * 100)}%`
                                        }}
                                      />
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-center ml-2">
                          {item.status === "COOKING" ? (
                            <button
                              onClick={() => toggleItemCompletion(item.id, true, item.status)}
                              className="px-3 py-1 text-xs font-medium bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                            >
                              Ready
                            </button>
                          ) : item.status === "READY" ? (
                            <div className="px-2 py-1 text-xs font-medium text-green-600 bg-green-100 rounded">
                              Complete
                            </div>
                          ) : (
                            <button
                              onClick={() => toggleItemCompletion(item.id, true, item.status)}
                              className="px-3 py-1 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                            >
                              Start
                            </button>
                          )}
                          <span className="text-xs font-medium text-neutral-800 mt-1">
                            ${((item.price_cents ?? 0) / 100).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 bg-white rounded-md">
                      <span className="text-neutral-800">{order.totalItems} items</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-200">
                  {orderDetails?.specialInstructions ? (
                    <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
                      <div className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500 mt-0.5 mr-1.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <span className="block text-xs font-medium text-amber-800">Special Instructions:</span>
                          <p className="text-sm italic text-amber-700">{orderDetails.specialInstructions}</p>
                        </div>
                      </div>
                    </div>
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
        })
      )}
    </div>
  );
}
