import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TimerDisplayProps {
  createdAt: Date | string;
  isDelayed?: boolean;
  className?: string;
}

export function TimerDisplay({ createdAt, isDelayed = false, className }: TimerDisplayProps) {
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(0);
  
  useEffect(() => {
    // Calculate initial elapsed time
    const createdTime = new Date(createdAt).getTime();
    const initialElapsedMinutes = Math.floor((Date.now() - createdTime) / (1000 * 60));
    setElapsedMinutes(initialElapsedMinutes);
    
    // Update elapsed time every 10 seconds
    const interval = setInterval(() => {
      const updatedElapsedMinutes = Math.floor((Date.now() - createdTime) / (1000 * 60));
      setElapsedMinutes(updatedElapsedMinutes);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [createdAt]);
  
  // Determine color based on elapsed time
  let bgColor = 'bg-green-500';
  let textColor = 'text-white';
  
  if (isDelayed || elapsedMinutes > 20) {
    bgColor = 'bg-red-500';
  } else if (elapsedMinutes > 15) {
    bgColor = 'bg-amber-500';
  }
  
  return (
    <span className={cn(
      "text-xs font-medium px-3 py-1.5 rounded-full shadow-sm flex items-center",
      bgColor,
      textColor,
      className
    )}>
      {elapsedMinutes > 0 ? `${elapsedMinutes}:00` : '0:00'}
    </span>
  );
}