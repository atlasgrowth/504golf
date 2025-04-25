import { cn } from "@/lib/utils";

interface OrderStatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig = {
  pending: {
    background: 'bg-neutral-200 bg-opacity-60',
    text: 'text-neutral-700',
    label: 'Pending'
  },
  preparing: {
    background: 'bg-success bg-opacity-10',
    text: 'text-success',
    label: 'In Progress'
  },
  ready: {
    background: 'bg-warning bg-opacity-10',
    text: 'text-warning',
    label: 'Ready'
  },
  served: {
    background: 'bg-primary bg-opacity-10',
    text: 'text-primary',
    label: 'Served'
  },
  cancelled: {
    background: 'bg-neutral-200 bg-opacity-60',
    text: 'text-neutral-600',
    label: 'Cancelled'
  },
  delayed: {
    background: 'bg-danger bg-opacity-10',
    text: 'text-danger',
    label: 'Delayed'
  }
};

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const isDelayed = status === 'delayed';
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <span className={cn(
      "px-2 py-1 text-xs rounded-full",
      config.background,
      config.text,
      className
    )}>
      {config.label}
    </span>
  );
}
