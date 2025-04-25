import { cn } from "@/lib/utils";

import { Utensils, Flag, Clock, AlertTriangle } from "lucide-react";

interface BayStatusBadgeProps {
  status: string;
  className?: string;
}

interface StatusConfig {
  background: string;
  ringColor: string;
  holeBg: string;
  flagColor: string;
  text: string;
  label: string;
  icon?: React.ReactNode;
}

const statusConfig: Record<string, StatusConfig> = {
  empty: {
    background: 'bg-green-50',
    ringColor: 'border-green-200',
    holeBg: 'bg-white',
    flagColor: 'bg-gray-200',
    text: 'text-gray-500',
    label: 'Available'
  },
  NEW: {
    background: 'bg-blue-50',
    ringColor: 'border-blue-300',
    holeBg: 'bg-blue-100',
    flagColor: 'bg-blue-400',
    text: 'text-blue-700',
    label: 'Pending',
    icon: <Clock className="h-3 w-3" />
  },
  COOKING: {
    background: 'bg-amber-50',
    ringColor: 'border-amber-300',
    holeBg: 'bg-amber-100',
    flagColor: 'bg-amber-400',
    text: 'text-amber-700',
    label: 'Cooking',
    icon: <Utensils className="h-3 w-3" />
  },
  READY: {
    background: 'bg-green-50',
    ringColor: 'border-green-300',
    holeBg: 'bg-green-100',
    flagColor: 'bg-green-400',
    text: 'text-green-700',
    label: 'Ready',
    icon: <Flag className="h-3 w-3" />
  },
  DELAYED: {
    background: 'bg-orange-50',
    ringColor: 'border-orange-300',
    holeBg: 'bg-orange-100',
    flagColor: 'bg-orange-400',
    text: 'text-orange-700',
    label: 'Delayed',
    icon: <Clock className="h-3 w-3" />
  },
  flagged: {
    background: 'bg-yellow-50',
    ringColor: 'border-yellow-300',
    holeBg: 'bg-yellow-100',
    flagColor: 'bg-yellow-400',
    text: 'text-yellow-700',
    label: 'Flagged',
    icon: <Flag className="h-3 w-3" />
  },
  alert: {
    background: 'bg-red-50',
    ringColor: 'border-red-300',
    holeBg: 'bg-red-100',
    flagColor: 'bg-red-400',
    text: 'text-red-700',
    label: 'Alert',
    icon: <AlertTriangle className="h-3 w-3" />
  }
};

export function BayStatusBadge({ status, className }: BayStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.empty;

  return (
    <div className={cn(
      "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
      config.background,
      config.text,
      className
    )}>
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
}

export function BayStatusContainer({ status, className, children }: BayStatusBadgeProps & { children: React.ReactNode }) {
  const config = statusConfig[status] || statusConfig.empty;

  return (
    <div className={cn(
      "p-3 relative group hover-lift transition-all cursor-pointer",
      className
    )}>
      {/* Golf hole design */}
      <div className={cn(
        "relative w-full aspect-square rounded-full mb-2",
        config.background,
        "border-4",
        config.ringColor,
        "shadow-sm",
        "flex flex-col items-center justify-center overflow-hidden"
      )}>
        {/* The hole */}
        <div className={cn(
          "absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full transform translate-y-1/3",
          config.holeBg
        )}></div>
        
        {/* Flag - only shown for non-empty bays */}
        {status !== 'empty' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="h-10 w-1 bg-gray-400"></div>
            <div className={cn(
              "w-6 h-4 -translate-x-3 translate-y-1",
              config.flagColor
            )}></div>
          </div>
        )}
        
        {/* Bay number */}
        <div className="z-10 text-xl font-bold">{children}</div>
      </div>
      
      {/* Status badge */}
      <div className="flex justify-center">
        <BayStatusBadge status={status} />
      </div>
    </div>
  );
}
