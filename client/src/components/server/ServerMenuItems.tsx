import { Category, MenuItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ServerMenuItemsProps {
  menuData: Array<{
    category: Category;
    items: MenuItem[];
  }>;
  onAddToCart: (item: { menuItemId: string; name: string; priceCents: number; quantity: number }) => void;
}

export default function ServerMenuItems({ menuData, onAddToCart }: ServerMenuItemsProps) {
  // Flatten all menu items into a single array
  const allItems = menuData.flatMap(category => category.items);
  
  // Format price from cents to dollars
  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };
  
  const handleAddToCart = (item: MenuItem) => {
    onAddToCart({
      menuItemId: item.id,
      name: item.name,
      priceCents: item.price_cents, // This matches the database column name
      quantity: 1
    });
  };
  
  return (
    <div className="space-y-4 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allItems.map((item) => (
          <div key={item.id} className="flex border border-neutral-200 rounded-lg overflow-hidden shadow-sm h-full">
            {item.image_url && (
              <img src={item.image_url} className="w-24 h-full object-cover" alt={item.name} />
            )}
            <div className="p-3 flex-1 flex flex-col">
              <div className="flex justify-between">
                <h3 className="font-medium text-neutral-800">{item.name}</h3>
                <span className="font-medium text-primary">{formatPrice(item.price_cents)}</span>
              </div>
              <p className="text-sm text-neutral-600 mb-2 flex-grow">{item.description}</p>
              <div className="flex justify-between items-center mt-auto">
                <span className="text-xs text-neutral-500">Prep time: {Math.ceil(item.prep_seconds / 60)} min</span>
                <Button 
                  size="sm"
                  variant="outline"
                  className="px-2 py-1 border-primary text-primary hover:bg-primary hover:text-white"
                  onClick={() => handleAddToCart(item)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}