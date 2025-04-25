import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bay, Category, MenuItem, Cart } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ServerOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ServerOrderDialog({ open, onOpenChange }: ServerOrderDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBay, setSelectedBay] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [cart, setCart] = useState<Cart>({
    items: [],
    specialInstructions: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch bays
  const { data: bays = [], isLoading: baysLoading } = useQuery<Bay[]>({
    queryKey: ['/api/bays'],
  });
  
  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/menu'],
  });
  
  // Fetch menu items based on selected category
  const endpoint = selectedTab === "all" ? "/api/menu" : `/api/menu/${selectedTab}`;
  const { data: menuData = [], isLoading: menuLoading } = useQuery<Array<{
    category: Category;
    items: MenuItem[];
  }>>({
    queryKey: [endpoint],
  });

  // Reset cart when dialog closes
  useEffect(() => {
    if (!open) {
      setCart({
        items: [],
        specialInstructions: ""
      });
      setSelectedBay(null);
    }
  }, [open]);
  
  // Add item to cart
  const addToCart = (item: { menuItemId: string; name: string; priceCents: number; quantity: number; station?: string }) => {
    // Make sure priceCents is always included
    const cartItem = {
      ...item,
      priceCents: item.priceCents || 0 // Ensure priceCents has a value
    };
    
    setCart(prevCart => {
      const existingItem = prevCart.items.find(i => i.menuItemId === cartItem.menuItemId);
      
      if (existingItem) {
        return {
          ...prevCart,
          items: prevCart.items.map(i => 
            i.menuItemId === cartItem.menuItemId 
              ? { ...i, quantity: i.quantity + cartItem.quantity } 
              : i
          )
        };
      } else {
        return {
          ...prevCart,
          items: [...prevCart.items, cartItem]
        };
      }
    });
    
    console.log('Added item to cart:', cartItem);
  };
  
  // Remove item from cart
  const removeFromCart = (menuItemId: string) => {
    setCart(prevCart => ({
      ...prevCart,
      items: prevCart.items.filter(item => item.menuItemId !== menuItemId)
    }));
  };
  
  // Update item quantity
  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
      return;
    }
    
    setCart(prevCart => ({
      ...prevCart,
      items: prevCart.items.map(item => 
        item.menuItemId === menuItemId 
          ? { ...item, quantity } 
          : item
      )
    }));
  };
  
  // Update special instructions
  const updateSpecialInstructions = (instructions: string) => {
    setCart(prevCart => ({
      ...prevCart,
      specialInstructions: instructions
    }));
  };
  
  // Calculate total
  const totalPrice = cart.items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);
  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Format price from cents to dollars
  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };
  
  // Place order
  const placeOrder = async () => {
    if (!selectedBay) {
      toast({
        title: "Bay Required",
        description: "Please select a bay for this order.",
        variant: "destructive",
      });
      return;
    }
    
    if (cart.items.length === 0) {
      toast({
        title: "Empty Order",
        description: "Please add items to the order.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Get bay by number
      const bayData = bays.find(bay => bay.number === selectedBay);
      
      if (!bayData) {
        throw new Error(`Bay ${selectedBay} not found`);
      }
      
      // Create order
      const orderData = {
        order: {
          orderNumber: "", // Will be generated server-side
          bayId: bayData.id,
          status: "pending",
          orderType: "server",
          specialInstructions: cart.specialInstructions || "",
        },
        cart
      };
      
      const response = await apiRequest('POST', '/api/orders', orderData);
      const newOrder = await response.json();
      
      // Reset form and close dialog
      setCart({
        items: [],
        specialInstructions: ""
      });
      setSelectedBay(null);
      onOpenChange(false);
      
      // Invalidate orders query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
      toast({
        title: "Order Placed",
        description: `Order #${newOrder.orderNumber} has been placed successfully!`,
      });
    } catch (error) {
      console.error("Failed to place order:", error);
      toast({
        title: "Order Failed",
        description: "There was an error placing the order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-[90%] max-w-4xl h-[80vh] flex flex-col p-4 overflow-hidden relative">
        <button 
          key="close-button"
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          onClick={() => onOpenChange(false)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div className="mb-4 border-b pb-2">
          <h2 className="text-xl font-semibold">Create New Order</h2>
        </div>
        
        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* Left side - Menu */}
          <div className="w-2/3 overflow-y-auto pr-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Select Bay
              </label>
              <Select value={selectedBay?.toString()} onValueChange={(value) => setSelectedBay(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a bay" />
                </SelectTrigger>
                <SelectContent>
                  {baysLoading ? (
                    <SelectItem value="loading">Loading...</SelectItem>
                  ) : (
                    bays.map((bay) => (
                      <SelectItem key={bay.id} value={bay.number.toString()}>
                        Bay {bay.number} (Floor {bay.floor})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <Tabs defaultValue="menu" className="mt-4">
              <TabsList>
                <TabsTrigger value="menu">Menu</TabsTrigger>
                <TabsTrigger value="specials">Daily Specials</TabsTrigger>
              </TabsList>
              
              <TabsContent value="menu" className="pt-4">
                {categoriesLoading ? (
                  <p>Loading categories...</p>
                ) : (
                  <div className="mb-6">
                    <div className="flex overflow-x-auto pb-2 space-x-2 no-scrollbar">
                      <button 
                        key="all-items-button"
                        className={`px-4 py-2 rounded-full whitespace-nowrap ${
                          selectedTab === "all" 
                            ? "bg-primary text-white" 
                            : "bg-white border border-neutral-300 text-neutral-700"
                        }`}
                        onClick={() => setSelectedTab("all")}
                      >
                        All Items
                      </button>
                      
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          className={`px-4 py-2 rounded-full whitespace-nowrap ${
                            selectedTab === category.slug 
                              ? "bg-primary text-white" 
                              : "bg-white border border-neutral-300 text-neutral-700"
                          }`}
                          onClick={() => setSelectedTab(category.slug)}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {menuLoading ? (
                  <p>Loading menu items...</p>
                ) : (
                  <div className="space-y-4 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {menuData.flatMap(category => category.items).map((item) => (
                        <div key={item.id} className="flex border border-neutral-200 rounded-lg overflow-hidden shadow-sm h-full">
                          {item.image_url && (
                            <img src={item.image_url} className="w-24 h-full object-cover" alt={item.name} />
                          )}
                          <div className="p-3 flex-1 flex flex-col">
                            <div className="flex justify-between">
                              <h3 className="font-medium text-neutral-800">{item.name}</h3>
                              <span className="font-medium text-primary">{formatPrice(item.priceCents)}</span>
                            </div>
                            <p className="text-sm text-neutral-600 mb-2 flex-grow">{item.description}</p>
                            <div className="flex justify-between items-center mt-auto">
                              <span className="text-xs text-neutral-500">Prep time: {Math.ceil(item.prepSeconds / 60)} min</span>
                              <Button 
                                size="sm"
                                variant="outline"
                                className="px-2 py-1 border-primary text-primary hover:bg-primary hover:text-white"
                                onClick={() => addToCart({
                                  menuItemId: item.id,
                                  name: item.name,
                                  priceCents: item.priceCents,
                                  quantity: 1
                                })}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1">
                                  <line x1="12" y1="5" x2="12" y2="19"></line>
                                  <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="specials" className="pt-4">
                <div className="p-4 bg-neutral-100 rounded-md text-center">
                  <p>Daily specials will be displayed here.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right side - Cart */}
          <div className="w-1/3 bg-neutral-50 p-4 rounded-md overflow-y-auto">
            <h3 className="font-semibold text-lg mb-2">Order Summary</h3>
            
            {cart.items.length === 0 ? (
              <div className="text-center py-6 text-neutral-500">
                <p>No items in cart</p>
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {cart.items.map((item) => (
                  <div key={item.menuItemId} className="flex justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-neutral-600">{formatPrice(item.priceCents)} each</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        key={`${item.menuItemId}-dec`}
                        className="px-2 py-1 bg-neutral-200 rounded-md"
                        onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span key={`${item.menuItemId}-qty`}>{item.quantity}</span>
                      <button 
                        key={`${item.menuItemId}-inc`}
                        className="px-2 py-1 bg-neutral-200 rounded-md"
                        onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Special Instructions
              </label>
              <Textarea 
                placeholder="Any special requests or allergies?"
                value={cart.specialInstructions || ""}
                onChange={(e) => updateSpecialInstructions(e.target.value)}
                className="w-full"
                rows={3}
              />
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between mb-2">
                <span>Items:</span>
                <span>{totalItems}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t flex justify-end space-x-3">
          <button 
            key="cancel-button"
            className="px-4 py-2 border border-neutral-300 rounded-md"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button 
            key="place-order-button"
            className="px-4 py-2 bg-primary text-white rounded-md disabled:opacity-50"
            onClick={placeOrder}
            disabled={isSubmitting || cart.items.length === 0 || !selectedBay}
          >
            {isSubmitting ? "Placing Order..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}