import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface CookTimerProps {
  firedAt?: string | Date | null;
  cookSeconds?: number | null;
  className?: string;
}

export function CookTimer({ firedAt, cookSeconds = 300, className }: CookTimerProps) {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [percentComplete, setPercentComplete] = useState(0);
  
  // Update every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Calculate elapsed time and percentage whenever the current time changes
  useEffect(() => {
    if (!firedAt) {
      setElapsedSeconds(0);
      setPercentComplete(0);
      return;
    }
    
    const firedTime = new Date(firedAt).getTime();
    const elapsedMs = currentTime - firedTime;
    const elapsedSec = Math.max(0, Math.floor(elapsedMs / 1000));
    
    setElapsedSeconds(elapsedSec);
    
    // Calculate percentage based on cook time
    const percentage = cookSeconds ? Math.min(100, (elapsedSec / cookSeconds) * 100) : 0;
    setPercentComplete(percentage);
  }, [currentTime, firedAt, cookSeconds]);
  
  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Determine color based on percentage
  const getProgressBarColor = () => {
    if (percentComplete >= 100) return "bg-red-500";
    if (percentComplete >= 75) return "bg-amber-500";
    if (percentComplete >= 50) return "bg-amber-400";
    return "bg-green-500";
  };
  
  // Quick way to check if timer is running
  const isRunning = firedAt !== null && firedAt !== undefined;
  
  return (
    <div className={cn("flex flex-col space-y-1", className)}>
      <div className="flex justify-between items-center text-xs">
        <span>{isRunning ? formatTime(elapsedSeconds) : "Not started"}</span>
        {cookSeconds && (
          <span className="text-neutral-500">
            / {formatTime(cookSeconds)}
          </span>
        )}
      </div>
      
      <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-1000 ease-linear", getProgressBarColor())}
          style={{ width: `${percentComplete}%` }}
        />
      </div>
      
      {/* Optional status indicator */}
      {percentComplete >= 100 && (
        <span className="text-xs font-medium text-red-500">Overdue!</span>
      )}
    </div>
  );
}

// Special version for use in kitchen view - optimized for real-time display
export function KitchenCookTimer({ firedAt, cookSeconds = 300, className }: CookTimerProps) {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [percentComplete, setPercentComplete] = useState(0);
  
  // More frequent updates for kitchen view (every 0.5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  // Calculate elapsed time and percentage whenever the current time changes
  useEffect(() => {
    if (!firedAt) {
      setElapsedSeconds(0);
      setPercentComplete(0);
      return;
    }
    
    const firedTime = new Date(firedAt).getTime();
    const elapsedMs = currentTime - firedTime;
    const elapsedSec = Math.max(0, Math.floor(elapsedMs / 1000));
    
    setElapsedSeconds(elapsedSec);
    
    // Calculate percentage based on cook time
    const percentage = cookSeconds ? Math.min(100, (elapsedSec / cookSeconds) * 100) : 0;
    setPercentComplete(percentage);
  }, [currentTime, firedAt, cookSeconds]);
  
  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Determine color based on percentage
  const getProgressBarColor = () => {
    if (percentComplete >= 100) return "bg-red-500";
    if (percentComplete >= 75) return "bg-amber-500";
    if (percentComplete >= 50) return "bg-amber-400";
    return "bg-green-500";
  };
  
  // Quick way to check if timer is running
  const isRunning = firedAt !== null && firedAt !== undefined;
  
  return (
    <div className={cn("flex flex-col space-y-1 w-full", className)}>
      <div className="flex justify-between items-center text-xs font-medium">
        <span className={cn(
          percentComplete >= 100 ? "text-red-600" : 
          percentComplete >= 75 ? "text-amber-600" : 
          "text-green-600"
        )}>
          {isRunning ? formatTime(elapsedSeconds) : "--:--"}
        </span>
        {cookSeconds && (
          <span className="text-neutral-600">
            / {formatTime(cookSeconds)}
          </span>
        )}
      </div>
      
      <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-500 ease-linear", getProgressBarColor())}
          style={{ width: `${percentComplete}%` }}
        />
      </div>
      
      {/* Status indicator - only show when needed */}
      {percentComplete >= 100 && (
        <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded text-center">
          {Math.floor((percentComplete - 100) / 10) > 5 ? "Critical!" : "Overdue!"}
        </span>
      )}
    </div>
  );
}