import { useState, useEffect } from 'react';
import { useWebSocket } from './hooks/use-websocket';
import { OrderSummary } from '@swingeats/shared';

function App() {
  const { lastMessage, sendMessage, readyState } = useWebSocket();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('Connecting...');

  // WebSocket connection status
  useEffect(() => {
    switch (readyState) {
      case WebSocket.CONNECTING:
        setConnectionStatus('Connecting...');
        break;
      case WebSocket.OPEN:
        setConnectionStatus('Connected');
        break;
      case WebSocket.CLOSING:
        setConnectionStatus('Closing...');
        break;
      case WebSocket.CLOSED:
        setConnectionStatus('Disconnected');
        break;
      default:
        setConnectionStatus('Unknown');
    }
  }, [readyState]);

  // Process WebSocket messages
  useEffect(() => {
    if (lastMessage?.type === 'orders_update') {
      // Sort orders by estimatedCompletionTime ascending (priority to readyBy soonest)
      const sortedOrders = [...lastMessage.data.orders];
      sortedOrders.sort((a, b) => {
        // If estimated completion time exists, use it for sorting
        if (a.estimatedCompletionTime && b.estimatedCompletionTime) {
          return new Date(a.estimatedCompletionTime).getTime() - new Date(b.estimatedCompletionTime).getTime();
        }
        // Fallback to creation time if estimatedCompletionTime not available
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
      
      setOrders(sortedOrders);
    }
  }, [lastMessage]);

  // Initial data fetch on mount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders/preparing');
        if (response.ok) {
          const data = await response.json();
          
          // Sort orders by estimatedCompletionTime
          const sortedOrders = [...data];
          sortedOrders.sort((a, b) => {
            if (a.estimatedCompletionTime && b.estimatedCompletionTime) {
              return new Date(a.estimatedCompletionTime).getTime() - new Date(b.estimatedCompletionTime).getTime();
            }
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          });
          
          setOrders(sortedOrders);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, []);

  // Function to update order item status
  const updateOrderItemStatus = async (orderItemId: string, completed: boolean) => {
    try {
      await fetch(`/api/orderitem/${orderItemId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed }),
      });
      
      // Success notification would go here
    } catch (error) {
      console.error('Error updating order item status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">SwingEats Kitchen Display</h1>
        <div className={`px-3 py-1 rounded-full text-sm ${readyState === WebSocket.OPEN ? 'bg-green-600' : 'bg-red-600'}`}>
          {connectionStatus}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.length === 0 ? (
          <div className="col-span-full text-center p-12 bg-gray-800 rounded-lg">
            <p className="text-xl">No active orders at this time</p>
          </div>
        ) : (
          orders.map((order) => (
            <div 
              key={order.id} 
              className={`bg-gray-800 p-4 rounded-lg ${order.isDelayed ? 'late-ticket' : ''}`}
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold">Bay {order.bayNumber}</h2>
                <span className="text-sm">Floor {order.floor}</span>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <span className="bg-blue-600 px-2 py-1 rounded text-xs">
                  Order #{order.id.substring(0, 8)}
                </span>
                <span className="text-xs">
                  {Math.floor(order.timeElapsed)} min ago
                </span>
              </div>

              {order.estimatedCompletionTime && (
                <div className="mb-4 text-yellow-400">
                  Ready by: {new Date(order.estimatedCompletionTime).toLocaleTimeString()}
                </div>
              )}
              
              <div className="text-gray-400 mb-2">
                Order JSON data:
              </div>
              
              <pre className="bg-gray-900 p-3 rounded overflow-auto text-xs max-h-40">
                {JSON.stringify(order, null, 2)}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;