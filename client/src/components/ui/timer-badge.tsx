import { cn } from "@/lib/utils";

interface TimerBadgeProps {
  minutes: number;
  isDelayed?: boolean;
  className?: string;
}

export function TimerBadge({ minutes, isDelayed = false, className }: TimerBadgeProps) {
  // Determine color based on time
  let textColor = 'text-neutral-600';
  let bgColor = 'bg-neutral-200';
  
  if (isDelayed || minutes > 20) {
    textColor = 'text-danger';
    bgColor = 'bg-danger';
  } else if (minutes > 15) {
    textColor = 'text-warning';
    bgColor = 'bg-warning';
  } else {
    textColor = 'text-success';
    bgColor = 'bg-success';
  }
  
  // Format minutes
  const formatTime = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }
    return `${minutes}:00`;
  };

  return (
    <span className={cn(
      "text-xs",
      textColor,
      className
    )}>
      {formatTime(minutes)}
    </span>
  );
}

export function TimerPill({ minutes, isDelayed = false, className }: TimerBadgeProps) {
  // Determine color based on time
  let bgColor = 'bg-neutral-200';
  
  if (isDelayed || minutes > 20) {
    bgColor = 'bg-danger';
  } else if (minutes > 15) {
    bgColor = 'bg-warning';
  } else {
    bgColor = 'bg-success';
  }
  
  // Format minutes
  const formatTime = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours > 0) {
      return `${hours}:${remainingMins.toString().padStart(2, '0')}`;
    }
    return `${mins}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
  };

  return (
    <span className={cn(
      "text-xs px-2 py-1 rounded-full text-white",
      bgColor,
      className
    )}>
      {formatTime(minutes)}
    </span>
  );
}
