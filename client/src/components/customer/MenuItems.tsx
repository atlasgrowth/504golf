import { useState } from "react";
import { useOrder } from "@/contexts/OrderContext";
import { type Category, type MenuItem } from "@shared/schema";
import { PlusCircle, Clock, ChefHat } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MenuItemsProps {
  menuData: Array<{
    category: Category;
    items: MenuItem[];
  }>;
}

export default function MenuItems({ menuData }: MenuItemsProps) {
  const { addToCart } = useOrder();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const allItems = menuData.flatMap(category => category.items);
  
  const displayItems = selectedCategory 
    ? menuData
        .find(category => category.category.slug === selectedCategory)?.items || []
    : allItems;

  const handleAddToCart = (item: MenuItem) => {
    // Set selected item for animation
    setSelectedItem(item.id);
    
    // Add to cart
    addToCart({
      menuItemId: item.id,
      name: item.name,
      priceCents: item.price_cents,
      quantity: 1
    });
    
    // Show toast
    toast({
      title: "Added to order",
      description: `${item.name} has been added to your order`,
      duration: 2000,
    });
    
    // Reset selected item after animation completes
    setTimeout(() => {
      setSelectedItem(null);
    }, 500);
  };
  
  // Format price from cents to dollars
  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };
  
  // Format prep time from seconds to minutes
  const formatPrepTime = (seconds: number) => {
    return `${Math.ceil(seconds / 60)} min`;
  };

  return (
    <div className="space-y-6 mb-8">
      {displayItems.map((item) => (
        <div 
          key={item.id} 
          className={`glassmorphism rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg
                      ${selectedItem === item.id ? 'animate-jelly' : 'hover-lift'}`}
        >
          <div className="flex flex-col sm:flex-row">
            {item.image_url ? (
              <div className="relative w-full sm:w-32 h-32">
                <img 
                  src={item.image_url} 
                  className="w-full h-32 object-cover" 
                  alt={item.name} 
                />
                <div className="absolute top-0 right-0 m-2">
                  <Badge variant="secondary" className="shadow-md">
                    {item.category}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex w-32 h-32 bg-muted/50 items-center justify-center">
                <ChefHat className="h-10 w-10 text-muted-foreground/50" />
              </div>
            )}
            
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap justify-between items-start gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-foreground">{item.name}</h3>
                  <div className="text-lg font-semibold text-primary">
                    {formatPrice(item.price_cents)}
                  </div>
                </div>
                
                {item.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
                )}
                
                <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{formatPrepTime(item.prep_seconds)}</span>
                  </div>
                  <div className="flex items-center">
                    <ChefHat className="h-3 w-3 mr-1" />
                    <span>{item.station}</span>
                  </div>
                </div>
              </div>
              
              <Button 
                size="sm"
                variant="outline"
                className="btn-modern self-end group"
                onClick={() => handleAddToCart(item)}
              >
                <span className="mr-2 group-hover:scale-110 transition-transform">
                  <PlusCircle className="h-4 w-4" />
                </span>
                Add to Order
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
