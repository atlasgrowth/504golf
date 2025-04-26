import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import MenuGrid from "./MenuGrid";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { MenuItem, Category, getItemPriceCents, formatPriceAsDollars } from "../../types/menu";

interface SimpleOrderDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bayId: number | null;
}

interface CartItem {
  menuItemId: string;
  quantity: number;
  name: string;
  priceCents: number;
}

export default function SimpleOrderDrawer({ open, onOpenChange, bayId }: SimpleOrderDrawerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState<string>("");
  const [selectedBayId, setSelectedBayId] = useState<number | null>(bayId);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setCart([]);
      setSpecialInstructions("");
      setSelectedBayId(bayId);
    }
  }, [open, bayId]);

  // Get bays for selection
  const { data: bays = [], isLoading: baysLoading } = useQuery<Array<{
    id: number;
    number: number;
    floor: number;
    status: string;
  }>>({
    queryKey: ['/api/bays'],
    enabled: open && bayId === null,
  });

  // Menu data type
  type MenuDataType = Array<{
    category: Category;
    items: MenuItem[];
  }>;
  
  // Get menu data
  const { data: menuData = [], isLoading: menuLoading } = useQuery<MenuDataType>({
    queryKey: ['/api/menu'],
    enabled: open
  });

  // Debug log when component renders with menu data
  useEffect(() => {
    if (menuData && menuData.length > 0) {
      console.log('Menu data loaded:', menuData);
    }
  }, [menuData]);

  // Extract categories and menu items from data
  const categories = menuData ? menuData.map(item => item.category) : [];
  const menuItems = menuData ? menuData.flatMap(category => category.items) : [];

  // Handle adding an item to the cart
  const handleAddToCart = (item: MenuItem, quantity: number) => {
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(cartItem => cartItem.menuItemId === item.id);
    
    // Get price using our utility function
    const priceCents = getItemPriceCents(item);
    
    if (existingItemIndex >= 0) {
      // Update quantity if item already exists
      const newCart = [...cart];
      newCart[existingItemIndex].quantity += quantity;
      setCart(newCart);
    } else {
      // Add new item to cart
      setCart([...cart, {
        menuItemId: item.id,
        quantity: quantity,
        name: item.name,
        priceCents: priceCents
      }]);
    }
    
    toast({
      title: "Added to order",
      description: `${quantity}x ${item.name}`,
    });
  };
  
  // Remove item from cart
  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };
  
  // Handle order submission
  const submitOrder = async () => {
    if (!selectedBayId) {
      toast({
        title: "Error",
        description: "Please select a bay for this order",
        variant: "destructive",
      });
      return;
    }
    
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the order",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Ensure items have numeric price and quantity
      const payload = {
        order: {
          bayId: selectedBayId,
          specialInstructions: specialInstructions
        },
        cart: {
          items: cart.map(item => ({
            menuItemId: item.menuItemId,
            quantity: Number(item.quantity)
          }))
        }
      };
      
      const response = await apiRequest('POST', '/api/orders', payload);
      
      if (response.ok) {
        toast({
          title: "Order Placed",
          description: `Order placed successfully for Bay ${selectedBayId}`,
        });
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
        queryClient.invalidateQueries({ queryKey: ['/api/bays'] });
        
        // Close dialog
        onOpenChange(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to place order");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary">
            {selectedBayId ? `New Order - Bay ${selectedBayId}` : 'New Order'}
          </DialogTitle>
          <DialogDescription>
            Build your order by selecting items from the menu below
          </DialogDescription>
        </DialogHeader>

        {/* Main content */}
        <div className="space-y-6">
          {/* Bay Selection (only if no bayId was provided) */}
          {!bayId && (
            <div>
              <label className="block text-sm font-medium mb-1">Select Bay</label>
              <Select 
                value={selectedBayId?.toString() || ""} 
                onValueChange={(value) => setSelectedBayId(parseInt(value))}
                disabled={baysLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a bay" />
                </SelectTrigger>
                <SelectContent>
                  {bays.map((bay) => (
                    <SelectItem key={bay.id} value={bay.id.toString()}>
                      Bay {bay.number} (Floor {bay.floor})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Menu section - show only if bay is selected */}
          {selectedBayId && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Menu Grid - 2/3 of the space */}
              <div className="md:col-span-2">
                <h3 className="font-medium text-base mb-3">Menu</h3>
                {menuLoading ? (
                  <div className="space-y-2">
                    <div className="h-8 bg-muted rounded animate-pulse w-full" />
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 bg-muted rounded animate-pulse" />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[400px] overflow-y-auto pr-2">
                    <MenuGrid 
                      categories={categories} 
                      menuItems={menuItems} 
                      onSelectItem={handleAddToCart}
                    />
                  </div>
                )}
              </div>
              
              {/* Order Summary - 1/3 of the space */}
              <div className="border-l pl-4 md:pl-6">
                <h3 className="font-medium text-base mb-3">Order Summary</h3>
                
                {cart.length === 0 ? (
                  <div className="text-center py-6 bg-muted/20 rounded-lg text-muted-foreground">
                    No items added to order yet
                  </div>
                ) : (
                  <div>
                    <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto pr-2">
                      {cart.map((item, index) => (
                        <div key={index} className="flex justify-between items-center border-b pb-2">
                          <div className="pr-2">
                            <span className="font-medium">{item.quantity}x</span> {item.name}
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span>${formatPriceAsDollars(item.priceCents * item.quantity)}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => removeFromCart(index)}
                            >
                              <X size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-between font-bold text-lg mb-4 border-t border-primary/20 pt-2">
                      <span>Total:</span>
                      <span>${formatPriceAsDollars(cart.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0))}</span>
                    </div>
                    
                    {/* Special Instructions */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Special Instructions</label>
                      <Input
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        placeholder="Any special instructions..."
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            onClick={submitOrder}
            disabled={isSubmitting || !selectedBayId || cart.length === 0}
            className="w-full"
          >
            {isSubmitting ? "Placing Order..." : "Place Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}