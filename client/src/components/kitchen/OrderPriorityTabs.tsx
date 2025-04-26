import { cn } from "@/lib/utils";

interface OrderPriorityTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  counts: {
    all: number;
    pending: number;
    preparing: number;
    ready: number;
    delayed: number;
  };
}

export default function OrderPriorityTabs({ activeTab, setActiveTab, counts }: OrderPriorityTabsProps) {
  const tabs = [
    { id: "all", label: "All Orders", count: counts.all },
    { id: "pending", label: "Pending", count: counts.pending },
    { id: "preparing", label: "In Progress", count: counts.preparing },
    { id: "ready", label: "Ready to Serve", count: counts.ready },
    { id: "delayed", label: "Delayed", count: counts.delayed, danger: true },
  ];

  return (
    <div className="mb-6">
      <div className="border-b border-neutral-300">
        <nav className="-mb-px flex space-x-6">
          {tabs.map((tab) => (
            <a
              key={tab.id}
              href="#"
              className={cn(
                "whitespace-nowrap py-3 px-1 border-b-2 font-medium",
                activeTab === tab.id
                  ? tab.danger
                    ? "border-danger text-danger"
                    : "border-primary text-primary"
                  : "border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300",
                tab.danger && "text-danger hover:border-danger"
              )}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(tab.id);
              }}
            >
              {tab.label} ({tab.count})
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
