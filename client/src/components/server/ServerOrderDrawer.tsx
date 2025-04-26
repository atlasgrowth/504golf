import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from "@/components/ui/drawer";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, X } from "lucide-react";

interface ServerOrderDrawerProps {
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

interface OrderPayload {
  order: {
    bayId: number;
    specialInstructions: string;
  };
  cart: {
    items: {
      menuItemId: string;
      quantity: number;
    }[];
  };
}

export default function ServerOrderDrawer({ open, onOpenChange, bayId }: ServerOrderDrawerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState<string>("");
  const [selectedBayId, setSelectedBayId] = useState<number | null>(bayId);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Reset form when drawer opens
  useEffect(() => {
    if (open) {
      setSelectedCategoryId("");
      setSelectedMenuItemId("");
      setQuantity(1);
      setCart([]);
      setSpecialInstructions("");
      setSelectedBayId(bayId);
    }
  }, [open, bayId]);

  interface Bay {
    id: number;
    number: number;
    floor: number;
    status: string;
  }

  interface Category {
    id: number;
    name: string;
    slug: string;
  }

  interface MenuItem {
    id: string;
    name: string;
    description: string | null;
    category: string;
    priceCents: number;
    station: string;
    imageUrl: string | null;
    active: boolean;
  }

  // Get bays for selection
  const { data: bays = [], isLoading: baysLoading } = useQuery<Bay[]>({
    queryKey: ['/api/bays'],
    enabled: open && bayId === null,
  });

  // Get categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/menu'],
    enabled: open,
  });
  
  // Get menu items for selected category
  const { data: menuItems = [], isLoading: menuItemsLoading } = useQuery<MenuItem[]>({
    queryKey: ['/api/menu', selectedCategoryId],
    enabled: !!selectedCategoryId,
  });
  
  // Get selected menu item details
  const selectedMenuItem = menuItems.find(item => item.id === selectedMenuItemId);
  
  // Add item to cart
  const addToCart = () => {
    if (!selectedMenuItem || !selectedMenuItemId || quantity <= 0) {
      toast({
        title: "Error",
        description: "Please select a menu item and valid quantity",
        variant: "destructive",
      });
      return;
    }
    
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(item => item.menuItemId === selectedMenuItemId);
    
    if (existingItemIndex >= 0) {
      // Update quantity if item already exists
      const newCart = [...cart];
      newCart[existingItemIndex].quantity += quantity;
      setCart(newCart);
    } else {
      // Add new item to cart
      setCart([...cart, {
        menuItemId: selectedMenuItemId,
        quantity: quantity,
        name: selectedMenuItem.name,
        priceCents: selectedMenuItem.priceCents
      }]);
    }
    
    // Reset selection
    setSelectedMenuItemId("");
    setQuantity(1);
    
    toast({
      title: "Added to order",
      description: `${quantity}x ${selectedMenuItem.name}`,
    });
  };
  
  // Remove item from cart
  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };
  
  // Calculate total price
  const totalPrice = cart.reduce((sum, item) => sum + (item.priceCents * item.quantity) / 100, 0);
  
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
      const payload: OrderPayload = {
        order: {
          bayId: selectedBayId,
          specialInstructions: specialInstructions
        },
        cart: {
          items: cart.map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity
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
        
        // Close drawer
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
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[90vh]">
        <DrawerHeader className="border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-primary">
            {selectedBayId ? `New Order - Bay ${selectedBayId}` : 'New Order'}
          </DrawerTitle>
          <DrawerDescription>
            Add items to order and submit when ready
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="px-4 py-4 h-full overflow-y-auto">
          {/* Bay Selection (only if no bayId was provided) */}
          {!bayId && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Select Bay</label>
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
          
          {/* Item Selection - Only show if bay is selected */}
          {selectedBayId && (
            <>
              <div className="space-y-4 mb-6">
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
                  <Select 
                    value={selectedCategoryId} 
                    onValueChange={setSelectedCategoryId}
                    disabled={categoriesLoading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.slug}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Menu Item Selection */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Menu Item</label>
                  <Select 
                    value={selectedMenuItemId} 
                    onValueChange={setSelectedMenuItemId}
                    disabled={!selectedCategoryId || menuItemsLoading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a menu item" />
                    </SelectTrigger>
                    <SelectContent>
                      {menuItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} - ${(item.priceCents / 100).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Quantity Selection */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Quantity</label>
                  <div className="flex items-center">
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-24"
                    />
                    <Button
                      onClick={addToCart}
                      disabled={!selectedMenuItemId}
                      className="ml-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Order
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Cart Summary */}
              <div className="border rounded-md p-4 mb-6">
                <h3 className="font-medium text-lg mb-4">Order Summary</h3>
                
                {cart.length === 0 ? (
                  <div className="text-neutral-500 text-center py-4">
                    No items added to order yet
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-4">
                      {cart.map((item, index) => (
                        <div key={index} className="flex justify-between items-center border-b pb-2">
                          <div>
                            <span className="font-medium">{item.quantity}x</span> {item.name}
                          </div>
                          <div className="flex items-center space-x-4">
                            <span>${((item.priceCents * item.quantity) / 100).toFixed(2)}</span>
                            <button
                              onClick={() => removeFromCart(index)}
                              className="text-neutral-500 hover:text-danger"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>${totalPrice.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
              
              {/* Special Instructions */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-1">Special Instructions</label>
                <Input
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special instructions..."
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>
        
        <DrawerFooter className="border-t pt-4">
          <Button
            onClick={submitOrder}
            disabled={isSubmitting || !selectedBayId || cart.length === 0}
            className="bg-primary hover:bg-primary-dark text-white w-full"
          >
            {isSubmitting ? "Placing Order..." : "Place Order"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}