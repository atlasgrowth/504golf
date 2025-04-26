import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TimerDisplayProps {
  createdAt: Date | string;
  isDelayed?: boolean;
  className?: string;
}

export function TimerDisplay({ createdAt, isDelayed = false, className }: TimerDisplayProps) {
  const [elapsed, setElapsed] = useState<{ minutes: number, seconds: number }>({ minutes: 0, seconds: 0 });
  
  useEffect(() => {
    // Function to calculate elapsed time
    const calculateElapsed = () => {
      const createdTime = new Date(createdAt).getTime();
      const now = Date.now();
      const diffMs = now - createdTime;
      const minutes = Math.floor(diffMs / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      return { minutes, seconds };
    };
    
    // Calculate initial time
    setElapsed(calculateElapsed());
    
    // Update time every second
    const interval = setInterval(() => {
      setElapsed(calculateElapsed());
    }, 1000); // Update every second for smooth countdown
    
    // Clean up on unmount
    return () => clearInterval(interval);
  }, [createdAt]); // Re-run effect if createdAt changes
  
  // Determine color based on elapsed time
  let bgColor = 'bg-green-500';
  let textColor = 'text-white';
  
  if (isDelayed || elapsed.minutes > 20) {
    bgColor = 'bg-red-500';
  } else if (elapsed.minutes > 15) {
    bgColor = 'bg-amber-500';
  }
  
  return (
    <span className={cn(
      "text-xs font-medium px-3 py-1.5 rounded-full shadow-sm flex items-center",
      bgColor,
      textColor,
      className
    )}>
      {`${elapsed.minutes}:${elapsed.seconds.toString().padStart(2, '0')}`}
    </span>
  );
}