import { useState, useEffect } from "react";
import { OrderSummary } from "@shared/schema";
import { cn } from "@/lib/utils";

interface BayTabsProps {
  orders: OrderSummary[];
  onTabChange: (tab: string) => void;
}

export default function BayTabs({ orders, onTabChange }: BayTabsProps) {
  // Set initial tab to COMPLETE by default
  const [activeTab, setActiveTab] = useState("COMPLETE");
  
  // Filter out all completed orders first (SERVED, DINING, PAID)
  const activeOrders = orders.filter(o => {
    const status = o.status.toUpperCase();
    return !["SERVED", "DINING", "PAID"].includes(status);
  });
  
  // Compute counts for each status
  const pending = activeOrders.filter(o => ["PENDING", "NEW"].includes(o.status.toUpperCase())).length;
  const cooking = activeOrders.filter(o => o.status.toUpperCase() === "COOKING").length;
  const ready = activeOrders.filter(o => o.status.toUpperCase() === "READY").length;
  const delayed = activeOrders.filter(o => o.isDelayed).length;
  
  // Get count of completed orders by status
  const served = orders.filter(o => o.status.toUpperCase() === "SERVED").length;
  const dining = orders.filter(o => o.status.toUpperCase() === "DINING").length;
  const paid = orders.filter(o => o.status.toUpperCase() === "PAID").length;
  const completed = served + dining + paid;
  
  // Main pipeline tabs + Completed Orders
  const tabs = [
    { id: "ALL", label: "All Active", count: activeOrders.length },
    { id: "PENDING", label: "Pending", count: pending },
    { id: "COOKING", label: "Cooking", count: cooking },
    { id: "READY", label: "Ready", count: ready },
    { id: "DELAYED", label: "Delayed", count: delayed },
    { id: "COMPLETE", label: "Completed", count: completed },
    { id: "DELIVERED", label: "Delivered", count: served } // Renamed SERVED to DELIVERED for better UX
  ];
  
  // When tab changes, notify parent
  useEffect(() => {
    onTabChange(activeTab);
  }, [activeTab, onTabChange]);
  
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };
  
  // Group tabs for better organization
  const activeTabs = tabs.slice(0, 5); // ALL, PENDING, COOKING, READY, DELAYED
  const completedTabs = tabs.slice(5); // COMPLETE and DELIVERED
  
  return (
    <div className="mb-4">
      {/* Main flow tabs */}
      <div className="flex border-b border-neutral-200">
        {activeTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "px-4 py-2 font-medium text-sm",
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-neutral-600 hover:text-neutral-900"
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1 rounded bg-neutral-200 px-1.5 py-0.5 text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Completed order tabs - always show them */}
      <div className="flex pt-2 px-2 bg-gray-50 rounded-b-md mt-1">
        {completedTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "px-3 py-1 mr-1 text-xs font-medium rounded-full",
                activeTab === tab.id
                  ? tab.id === "COMPLETE" 
                      ? "bg-gray-700 text-white" 
                      : tab.id === "DELIVERED" 
                          ? "bg-primary text-white"
                          : "bg-teal-500 text-white"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100"
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn(
                  "ml-1 px-1.5 py-0.5 text-xs rounded-full",
                  activeTab === tab.id ? "bg-white bg-opacity-20" : "bg-gray-200"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
    </div>
  );
}