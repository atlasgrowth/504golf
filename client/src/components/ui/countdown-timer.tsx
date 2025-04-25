import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  targetTime: string | null; // ISO timestamp string for target time
  className?: string;
  showSeconds?: boolean;
  pulsing?: boolean;
  compact?: boolean;
  onComplete?: () => void;
}

export function CountdownTimer({ 
  targetTime, 
  className, 
  showSeconds = true,
  pulsing = false,
  compact = false,
  onComplete 
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<{ 
    minutes: number;
    seconds: number;
    isNegative: boolean;
  }>({ minutes: 0, seconds: 0, isNegative: false });
  
  useEffect(() => {
    if (!targetTime) return;
    
    const calculateTimeRemaining = () => {
      const now = new Date();
      const target = new Date(targetTime);
      const diffMs = target.getTime() - now.getTime();
      const isNegative = diffMs < 0;
      const absDiffMs = Math.abs(diffMs);
      
      // Convert to minutes and seconds
      const totalSeconds = Math.floor(absDiffMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      
      setTimeRemaining({ minutes, seconds, isNegative });
      
      // Call onComplete if we just hit 0
      if (diffMs <= 0 && diffMs > -1000 && onComplete) {
        onComplete();
      }
    };
    
    // Initial calculation
    calculateTimeRemaining();
    
    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);
    
    return () => clearInterval(interval);
  }, [targetTime, onComplete]);
  
  // Determine color based on time remaining
  const getColorClasses = () => {
    if (timeRemaining.isNegative) {
      return "text-red-500"; // Delayed
    } else if (timeRemaining.minutes < 1) {
      return "text-amber-500"; // Less than 1 minute
    } else if (timeRemaining.minutes < 3) {
      return "text-yellow-500"; // Less than 3 minutes
    } else {
      return "text-green-500"; // Plenty of time
    }
  };
  
  // Format time display
  const formatTime = () => {
    const { minutes, seconds, isNegative } = timeRemaining;
    
    if (compact) {
      return showSeconds 
        ? `${isNegative ? '-' : ''}${minutes}:${seconds.toString().padStart(2, '0')}`
        : `${isNegative ? '-' : ''}${minutes}m`;
    }
    
    if (isNegative) {
      return showSeconds
        ? `Late by ${minutes}:${seconds.toString().padStart(2, '0')}`
        : `Late by ${minutes}m`;
    } else {
      return showSeconds
        ? `${minutes}:${seconds.toString().padStart(2, '0')} remaining`
        : `${minutes}m remaining`;
    }
  };
  
  if (!targetTime) return null;
  
  return (
    <span 
      className={cn(
        getColorClasses(),
        pulsing && timeRemaining.isNegative && "animate-pulse",
        "font-medium",
        className
      )}
    >
      {formatTime()}
    </span>
  );
}