import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface EstimatedTimeDisplayProps {
  estimatedCompletionTime?: string | Date | null;
  firedAt?: string | Date | null;
  orderItems?: Array<{
    menuItem?: { prep_seconds?: number } | null;
    status?: string | null;
    firedAt?: string | Date | null;
  }> | null;
  className?: string;
  showLabel?: boolean;
}

export function EstimatedTimeDisplay({
  estimatedCompletionTime,
  firedAt,
  orderItems,
  className,
  showLabel = true
}: EstimatedTimeDisplayProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    // Calculate based on either provided estimatedCompletionTime or from orderItems
    const calculateRemainingTime = () => {
      // If estimatedCompletionTime is directly provided, use it
      if (estimatedCompletionTime) {
        const estTime = new Date(estimatedCompletionTime);
        const remaining = Math.max(0, Math.floor((estTime.getTime() - Date.now()) / 1000));
        setTimeRemaining(remaining);
        return;
      }

      // Otherwise calculate from orderItems if available
      if (orderItems && orderItems.length > 0) {
        setIsCalculating(true);
        
        // Find longest cooking item (that hasn't been marked as READY)
        const cookingItems = orderItems.filter(item => 
          item.status !== "READY" && item.status !== "DELIVERED" && item.status !== "VOIDED"
        );
        
        if (cookingItems.length === 0) {
          setTimeRemaining(0); // All items ready
          setIsCalculating(false);
          return;
        }

        let maxRemainingTime = 0;
        
        cookingItems.forEach(item => {
          // If the item is cooking, calculate remaining time
          if (item.status === "COOKING" && item.firedAt) {
            const prepSeconds = item.menuItem?.prep_seconds || 0;
            const startTime = new Date(item.firedAt).getTime();
            const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
            const remainingSeconds = Math.max(0, prepSeconds - elapsedSeconds);
            
            if (remainingSeconds > maxRemainingTime) {
              maxRemainingTime = remainingSeconds;
            }
          } 
          // If the item is not yet cooking, use its full prep time
          else if (item.status === "NEW" || item.status === "PENDING") {
            const prepSeconds = item.menuItem?.prep_seconds || 0;
            if (prepSeconds > maxRemainingTime) {
              maxRemainingTime = prepSeconds;
            }
          }
        });
        
        // Add a small buffer (30 seconds) for plating/handling
        maxRemainingTime += 30;
        
        setTimeRemaining(maxRemainingTime);
        setIsCalculating(false);
      }
    };

    // Initial calculation
    calculateRemainingTime();

    // Set up interval to update the remaining time
    const timer = setInterval(() => {
      calculateRemainingTime();
    }, 1000);

    return () => clearInterval(timer);
  }, [estimatedCompletionTime, orderItems, firedAt]);

  // Format seconds to mm:ss
  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return "Ready now";
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  // Determine color based on remaining time
  const getDisplayColor = () => {
    if (!timeRemaining && timeRemaining !== 0) return 'text-neutral-600';
    
    if (timeRemaining <= 0) {
      return 'text-green-600'; // Ready now
    } else if (timeRemaining <= 60) {
      return 'text-green-600'; // Less than 1 minute
    } else if (timeRemaining <= 180) {
      return 'text-amber-600'; // 1-3 minutes
    } else {
      return 'text-blue-600'; // Over 3 minutes
    }
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {showLabel && (
        <span className="text-xs text-neutral-500 mb-1">
          {timeRemaining !== null && timeRemaining <= 0 
            ? "Ready now" 
            : "Est. ready in"}
        </span>
      )}
      
      <span className={cn(
        "text-sm font-semibold",
        getDisplayColor()
      )}>
        {isCalculating ? (
          <span className="text-neutral-500">Calculating...</span>
        ) : timeRemaining === null ? (
          <span className="text-neutral-500">--:--</span>
        ) : (
          formatTimeRemaining(timeRemaining)
        )}
      </span>
    </div>
  );
}