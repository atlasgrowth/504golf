import { useState } from "react";
import { useOrder } from "@/contexts/OrderContext";
import { type Category, type MenuItem } from "@shared/schema";

interface MenuItemsProps {
  menuData: Array<{
    category: Category;
    items: MenuItem[];
  }>;
}

export default function MenuItems({ menuData }: MenuItemsProps) {
  const { addToCart } = useOrder();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const allItems = menuData.flatMap(category => category.items);
  
  const displayItems = selectedCategory 
    ? menuData
        .find(category => category.category.slug === selectedCategory)?.items || []
    : allItems;

  const handleAddToCart = (item: MenuItem) => {
    addToCart({
      menuItemId: item.id,
      name: item.name,
      priceCents: item.price_cents,
      quantity: 1
    });
  };
  
  // Format price from cents to dollars
  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-4 mb-8">
      {displayItems.map((item) => (
        <div key={item.id} className="flex border border-neutral-200 rounded-lg overflow-hidden shadow-sm">
          {item.image_url && (
            <img src={item.image_url} className="w-24 h-24 object-cover" alt={item.name} />
          )}
          <div className="p-3 flex-1">
            <div className="flex justify-between">
              <h3 className="font-poppins font-medium text-neutral-800">{item.name}</h3>
              <span className="font-medium text-primary">{formatPrice(item.price_cents)}</span>
            </div>
            <p className="text-sm text-neutral-600 mb-2">{item.description}</p>
            <button 
              className="px-2 py-1 bg-primary-light text-white rounded-md text-sm"
              onClick={() => handleAddToCart(item)}
            >
              Add to Order
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
