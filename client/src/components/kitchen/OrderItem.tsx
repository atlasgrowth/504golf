import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { CountdownTimer } from '@/components/ui/countdown-timer';
import { OrderItemStatus } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Flame, Check, Clock, AlertTriangle } from 'lucide-react';

interface OrderItemProps {
  item: any;
  orderId: string;
  onUpdateStatus?: (itemId: string, completed: boolean) => void;
}

export function OrderItem({ item, orderId, onUpdateStatus }: OrderItemProps) {
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Format price
  const formatPrice = (cents: number | null) => {
    if (cents === null) return '$0.00';
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Fire the item (start cooking)
  const handleFire = async (itemId: string) => {
    setIsLoading({ ...isLoading, [itemId]: true });
    try {
      await apiRequest('POST', `/api/order-items/${itemId}/fire`);
      toast({
        title: 'Item fired',
        description: 'Item has been sent to cooking',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/order', orderId] });
    } catch (error) {
      console.error('Error firing item:', error);
      toast({
        title: 'Error',
        description: 'Failed to fire item',
        variant: 'destructive',
      });
    } finally {
      setIsLoading({ ...isLoading, [itemId]: false });
    }
  };

  // Mark item as ready
  const handleReady = async (itemId: string) => {
    setIsLoading({ ...isLoading, [itemId]: true });
    try {
      await apiRequest('POST', `/api/order-items/${itemId}/ready`);
      toast({
        title: 'Item ready',
        description: 'Item has been marked as ready',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/order', orderId] });
    } catch (error) {
      console.error('Error marking item as ready:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark item as ready',
        variant: 'destructive',
      });
    } finally {
      setIsLoading({ ...isLoading, [itemId]: false });
    }
  };

  // Mark item as delivered
  const handleDeliver = async (itemId: string) => {
    setIsLoading({ ...isLoading, [itemId]: true });
    try {
      await apiRequest('POST', `/api/order-items/${itemId}/deliver`);
      toast({
        title: 'Item delivered',
        description: 'Item has been marked as delivered',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/order', orderId] });
      if (onUpdateStatus) {
        onUpdateStatus(itemId, true);
      }
    } catch (error) {
      console.error('Error marking item as delivered:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark item as delivered',
        variant: 'destructive',
      });
    } finally {
      setIsLoading({ ...isLoading, [itemId]: false });
    }
  };

  // Get status display information
  const getStatusInfo = () => {
    switch (item.status) {
      case OrderItemStatus.NEW:
        return {
          label: 'New',
          colorClass: 'bg-blue-100 text-blue-800',
          buttonAction: () => handleFire(item.id),
          buttonText: 'Fire',
          buttonIcon: <Flame className="mr-1 h-3 w-3" />,
          buttonVariant: 'default',
        };
      case OrderItemStatus.COOKING:
        return {
          label: 'Cooking',
          colorClass: 'bg-yellow-100 text-yellow-800',
          buttonAction: () => handleReady(item.id),
          buttonText: 'Ready',
          buttonIcon: <Check className="mr-1 h-3 w-3" />,
          buttonVariant: 'outline',
        };
      case OrderItemStatus.READY:
        return {
          label: 'Ready',
          colorClass: 'bg-green-100 text-green-800',
          buttonAction: () => handleDeliver(item.id),
          buttonText: 'Deliver',
          buttonIcon: <Check className="mr-1 h-3 w-3" />,
          buttonVariant: 'success',
        };
      case OrderItemStatus.DELIVERED:
        return {
          label: 'Delivered',
          colorClass: 'bg-gray-100 text-gray-800',
          buttonAction: null,
          buttonText: '',
          buttonIcon: null,
          buttonVariant: 'ghost',
        };
      default:
        return {
          label: 'Unknown',
          colorClass: 'bg-gray-100 text-gray-800',
          buttonAction: null,
          buttonText: '',
          buttonIcon: null,
          buttonVariant: 'ghost',
        };
    }
  };

  const statusInfo = getStatusInfo();
  const isFireable = item.status === OrderItemStatus.NEW;
  const isCooking = item.status === OrderItemStatus.COOKING;
  const isReady = item.status === OrderItemStatus.READY;
  const isCompleted = item.status === OrderItemStatus.DELIVERED || item.completed;

  return (
    <div 
      className={`rounded-md p-3 mb-2 transition-all ${
        isCompleted 
          ? 'bg-gray-50 opacity-75' 
          : isCooking 
            ? 'bg-yellow-50 border border-yellow-200' 
            : isReady 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-white border border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{item.quantity}x</span>
          <span className={`text-sm font-medium ${isCompleted ? 'line-through text-gray-500' : ''}`}>
            {item.menuItem?.name || 'Unknown Item'}
          </span>
          {item.notes && (
            <span className="text-xs text-gray-500 italic">
              ({item.notes})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {formatPrice(item.price_cents)}
          </span>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-xs rounded-full ${statusInfo.colorClass}`}>
            {statusInfo.label}
          </span>
          <span className="text-xs text-gray-500">
            {item.station || 'No station'}
          </span>
          
          {/* Show cook time for items that are cooking */}
          {isCooking && item.readyAt && (
            <div className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              <CountdownTimer 
                targetTime={item.readyAt} 
                compact={true}
                showSeconds={true}
                pulsing={true}
                className="font-medium"
              />
            </div>
          )}
          
          {/* Show cooking alert if it's taking too long */}
          {isCooking && item.firedAt && (
            <>
              {new Date().getTime() - new Date(item.firedAt).getTime() > (item.cookSeconds || 300) * 1000 && (
                <div className="flex items-center gap-1 text-xs text-red-500">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Overdue</span>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Action buttons */}
        {statusInfo.buttonAction && (
          <Button
            variant={statusInfo.buttonVariant as any}
            size="sm"
            onClick={statusInfo.buttonAction}
            disabled={isLoading[item.id]}
            className="text-xs h-7 px-2"
          >
            {statusInfo.buttonIcon}
            {statusInfo.buttonText}
          </Button>
        )}
      </div>
    </div>
  );
}