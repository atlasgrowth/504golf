import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import MenuCategories from "./MenuCategories";
import MenuItems from "./MenuItems";
import OrderSummary from "./OrderSummary";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import golfLogo from "@/assets/golf-logo.svg";

interface CustomerViewProps {
  bayNumber: number;
}

export default function CustomerView({ bayNumber }: CustomerViewProps) {
  const { toast } = useToast();
  const { lastMessage } = useWebSocket(bayNumber);
  
  const { data: bay, isLoading: bayLoading } = useQuery<{
    id: number;
    number: number;
    floor: number;
    status: string;
  }>({
    queryKey: [`/api/bay/${bayNumber}`],
  });

  // Get menu
  const { data: menu = [], isLoading: menuLoading } = useQuery<Array<{
    category: {
      id: number;
      name: string;
      slug: string;
    };
    items: Array<{
      id: string;
      name: string;
      description: string | null;
      category: string;
      price_cents: number;
      station: string;
      prep_seconds: number;
      image_url: string | null;
      active: boolean;
    }>;
  }>>({
    queryKey: ['/api/menu'],
  });

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage?.type === 'orderStatusUpdate') {
      toast({
        title: 'Order Status Updated',
        description: `Your order is now ${lastMessage.data.status}`,
      });
    }
  }, [lastMessage, toast]);

  return (
    <div className="mx-auto max-w-md px-4 py-6 bg-white shadow-lg rounded-lg">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="flex justify-center mb-2">
          <img src={golfLogo} alt="SwingEats Logo" className="w-10 h-10 text-primary" />
        </div>
        <h1 className="font-poppins font-bold text-2xl text-primary">SwingEats</h1>
        <div className="flex items-center justify-center mt-2 space-x-2">
          <i className="fas fa-location-dot text-neutral-600"></i>
          {bayLoading ? (
            <Skeleton className="h-5 w-32" />
          ) : (
            <span className="text-neutral-700">Bay {bayNumber} - Floor {bay?.floor}</span>
          )}
        </div>
      </div>
      
      {/* Menu Categories */}
      {menuLoading ? (
        <div className="mb-6">
          <Skeleton className="h-10 w-full mb-2" />
        </div>
      ) : (
        <MenuCategories categories={menu?.map(item => item.category) || []} />
      )}
      
      {/* Menu Items */}
      {menuLoading ? (
        <div className="space-y-4 mb-8">
          {Array(3).fill(0).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <MenuItems menuData={menu || []} />
      )}
      
      {/* Order Summary */}
      <OrderSummary bayNumber={bayNumber} />
    </div>
  );
}
