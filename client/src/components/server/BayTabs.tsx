import { useState, useEffect } from "react";
import { OrderSummary } from "@shared/schema";
import { cn } from "@/lib/utils";

interface BayTabsProps {
  orders: OrderSummary[];
  onTabChange: (tab: string) => void;
}

export default function BayTabs({ orders, onTabChange }: BayTabsProps) {
  // Set initial tab to READY by default
  const [activeTab, setActiveTab] = useState("READY");
  
  // Filter out SERVED orders first
  const activeOrders = orders.filter(o => 
    o.status.toUpperCase() !== "SERVED" && o.status !== "served"
  );
  
  // Compute counts for each status
  const pending = activeOrders.filter(o => o.status === "NEW" || o.status === "new" || o.status === "PENDING" || o.status === "pending").length;
  const cooking = activeOrders.filter(o => o.status === "COOKING" || o.status === "cooking").length;
  const ready = activeOrders.filter(o => o.status === "READY" || o.status === "ready").length;
  const late = activeOrders.filter(o => o.isDelayed).length;
  
  // Get count of served orders (for today)
  const served = orders.filter(o => 
    o.status.toUpperCase() === "SERVED" || o.status === "served"
  ).length;
  
  // Main pipeline tabs + Past Orders for the day
  const tabs = [
    { id: "PENDING", label: "Pending", count: pending },
    { id: "COOKING", label: "Cooking", count: cooking },
    { id: "READY", label: "Ready", count: ready },
    { id: "LATE", label: "Late", count: late },
    { id: "SERVED", label: "Past Orders", count: served }
  ];
  
  // When tab changes, notify parent
  useEffect(() => {
    onTabChange(activeTab);
  }, [activeTab, onTabChange]);
  
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };
  
  return (
    <div className="flex border-b border-neutral-200 mb-4">
      {tabs.map((tab) => (
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
  );
}