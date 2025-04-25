import { cn } from "@/lib/utils";

interface BayStatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig = {
  empty: {
    background: 'bg-neutral-100',
    border: 'border-neutral-300',
    text: 'text-neutral-600',
    label: 'Empty'
  },
  occupied: {
    background: 'bg-neutral-100',
    border: 'border-neutral-300',
    text: 'text-neutral-600',
    label: 'Occupied'
  },
  active: {
    background: 'bg-success bg-opacity-10',
    border: 'border-success',
    text: 'text-success',
    label: 'Active'
  },
  flagged: {
    background: 'bg-warning bg-opacity-10',
    border: 'border-warning',
    text: 'text-warning',
    label: 'Flagged'
  },
  alert: {
    background: 'bg-danger bg-opacity-10',
    border: 'border-danger',
    text: 'text-danger',
    label: 'Alert'
  }
};

export function BayStatusBadge({ status, className }: BayStatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.empty;

  return (
    <span className={cn(
      "text-xs",
      config.text,
      className
    )}>
      {config.label}
    </span>
  );
}

export function BayStatusContainer({ status, className, children }: BayStatusBadgeProps & { children: React.ReactNode }) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.empty;

  return (
    <div className={cn(
      "p-2 rounded-md flex flex-col items-center justify-center text-center cursor-pointer",
      config.background,
      config.border,
      className
    )}>
      {children}
    </div>
  );
}
