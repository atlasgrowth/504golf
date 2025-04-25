import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { CountdownTimer } from '@/components/ui/countdown-timer';
import { OrderItem } from './OrderItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { OrderSummary, OrderWithItems, OrderStatus } from '@shared/schema';

interface OrderCardProps {
  order: OrderSummary;
  expanded?: boolean;
}

export function OrderCard({ order, expanded = false }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch full order details when expanded
  const { data: orderDetails, isLoading } = useQuery<OrderWithItems>({
    queryKey: ['/api/order', order.id],
    enabled: isExpanded,
  });

  // Update order status
  const updateOrderStatus = async (status: string) => {
    setIsUpdating(true);
    try {
      await apiRequest('PUT', `/api/order/${order.id}/status`, { status });
      toast({
        title: 'Order updated',
        description: `Order marked as ${status.toLowerCase()}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/order', order.id] });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle mark as ready
  const handleMarkReady = () => updateOrderStatus(OrderStatus.READY);

  // Handle mark as cancelled
  const handleCancel = () => updateOrderStatus(OrderStatus.CANCELLED);

  // Group items by station
  const itemsByStation = useMemo(() => {
    if (!orderDetails?.items) return {} as Record<string, any[]>;
    
    const grouped: Record<string, any[]> = {};
    
    // Sort items first by preparation time (ascending)
    const sortedItems = [...orderDetails.items].sort((a, b) => {
      // First by status - new items first
      if (a.status !== b.status) {
        if (a.status === 'NEW') return -1;
        if (b.status === 'NEW') return 1;
      }
      
      // Then by prep time
      const aSeconds = a.cookSeconds || (a.menuItem?.prep_seconds || 0);
      const bSeconds = b.cookSeconds || (b.menuItem?.prep_seconds || 0);
      return aSeconds - bSeconds;
    });
    
    // Group by station
    sortedItems.forEach(item => {
      const station = item.station || (item.menuItem?.station || 'Other');
      if (!grouped[station]) {
        grouped[station] = [];
      }
      grouped[station].push(item);
    });
    
    return grouped;
  }, [orderDetails]);

  // Format station name for display
  const formatStationName = (station: string) => {
    return station.charAt(0).toUpperCase() + station.slice(1).toLowerCase();
  };

  // Get order status badge styling
  const getStatusBadge = () => {
    switch (order.status) {
      case OrderStatus.NEW:
        return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'New' };
      case OrderStatus.COOKING:
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Cooking' };
      case OrderStatus.READY:
        return { bg: 'bg-green-100', text: 'text-green-800', label: 'Ready' };
      case OrderStatus.SERVED:
        return { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Served' };
      case OrderStatus.CANCELLED:
        return { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', label: order.status };
    }
  };

  const statusBadge = getStatusBadge();
  
  // Get short order number for display
  const orderNumber = order.id.substring(0, 5);

  return (
    <Card className={`mb-4 overflow-hidden ${order.isDelayed ? 'border-red-300 shadow-sm shadow-red-100' : ''}`}>
      <CardHeader className="p-4 pb-2 flex flex-row justify-between items-center bg-gray-50">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">#{orderNumber}</span>
            <Badge className={`${statusBadge.bg} ${statusBadge.text} hover:${statusBadge.bg}`}>
              {statusBadge.label}
            </Badge>
            
            {order.isDelayed && (
              <Badge variant="destructive" className="animate-pulse">
                Delayed
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Bay {order.bayNumber} • {order.totalItems} items • {new Date(order.createdAt).toLocaleTimeString()}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Estimated completion time display */}
          {order.estimatedCompletionTime && (
            <div className="flex items-center gap-1 text-sm mr-2">
              <Clock className="h-4 w-4" />
              <CountdownTimer 
                targetTime={typeof order.estimatedCompletionTime === 'string' 
                  ? order.estimatedCompletionTime 
                  : order.estimatedCompletionTime.toISOString()} 
                compact={true} 
                className="font-medium"
              />
            </div>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 h-8 w-8"
          >
            {isExpanded ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <>
          <CardContent className="p-4 pt-3">
            {isLoading ? (
              <div className="h-20 flex items-center justify-center">
                <div className="animate-spin h-5 w-5 border-2 border-gray-500 rounded-full border-t-transparent"></div>
              </div>
            ) : (
              <div>
                {/* Special instructions */}
                {orderDetails?.specialInstructions && (
                  <div className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded text-sm">
                    <div className="font-medium text-amber-800 mb-1">Special Instructions:</div>
                    <div className="text-gray-800">{orderDetails.specialInstructions}</div>
                  </div>
                )}
                
                {/* Items grouped by station */}
                {Object.entries(itemsByStation).map(([station, items]) => (
                  <div key={station} className="mb-4">
                    <h4 className="text-sm font-medium mb-2 text-gray-700 flex items-center">
                      <span className="mr-2">{formatStationName(station)}</span>
                      <Badge variant="outline" className="font-normal">{items.length}</Badge>
                    </h4>
                    <div>
                      {items.map((item: any) => (
                        <OrderItem 
                          key={item.id} 
                          item={item}
                          orderId={order.id}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                
                {/* Show message if no items */}
                {orderDetails?.items && orderDetails.items.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No items in this order
                  </div>
                )}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="p-4 pt-0 justify-end gap-2">
            {order.status === OrderStatus.COOKING && (
              <Button 
                onClick={handleMarkReady}
                disabled={isUpdating}
                className="text-sm"
                variant="outline"
              >
                <Check className="mr-1 h-4 w-4" />
                Mark Order Ready
              </Button>
            )}
            
            {(order.status === OrderStatus.NEW || order.status === OrderStatus.COOKING) && (
              <Button 
                onClick={handleCancel}
                disabled={isUpdating}
                variant="destructive"
                className="text-sm"
              >
                <X className="mr-1 h-4 w-4" />
                Cancel Order
              </Button>
            )}
          </CardFooter>
        </>
      )}
    </Card>
  );
}