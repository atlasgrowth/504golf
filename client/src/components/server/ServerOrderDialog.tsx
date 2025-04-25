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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-[90%] max-w-5xl h-[85vh] flex flex-col overflow-hidden relative shadow-2xl border-l-4 border-primary">
        <div className="bg-gradient-to-r from-primary to-primary/80 p-5 text-white flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M7 2h10"></path>
              <path d="M10 12 A2 2 0 0 1 8 10 A6 6 0 0 1 14 4c0 0 2 2 .5 3"></path>
              <path d="M7 14c0 2 2 3 5 3 3.5 0 5-1 5-4"></path>
              <path d="M22 5c0 9-4 12-6 12-1.7 0-4-1-7-1-3 0-4 1-4 1"></path>
              <path d="M22 14c0 4-1.5 6-3 6s-3-2-6-2-5 2-8 2"></path>
            </svg>
            <h2 className="text-2xl font-bold tracking-tight">Create New Order</h2>
          </div>
          <button 
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2 transition-colors"
            onClick={() => onOpenChange(false)}
            aria-label="Close dialog"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Left side - Menu */}
          <div className="w-2/3 overflow-y-auto p-6 border-r border-neutral-100">
            <div className="mb-5">
              <label className="flex items-center gap-2 mb-2 text-sm font-medium text-neutral-800">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                Select Bay Location
              </label>
              <Select value={selectedBay?.toString()} onValueChange={(value) => setSelectedBay(Number(value))}>
                <SelectTrigger className="bg-white border-neutral-200 hover:border-primary/50 transition-colors">
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
            
            <Tabs defaultValue="menu" className="mt-6">
              <TabsList className="bg-neutral-100 p-1 rounded-lg">
                <TabsTrigger value="menu" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                    <circle cx="12" cy="5" r="1"></circle>
                    <path d="M9 5h.01"></path>
                    <circle cx="15" cy="5" r="1"></circle>
                    <path d="M3 9h18M3 4h18M9 4v6M15 4v6"></path>
                    <path d="M3 9c0 6 3.5 12 9 12s9-6 9-12"></path>
                  </svg>
                  Full Menu
                </TabsTrigger>
                <TabsTrigger value="specials" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  Daily Specials
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="menu" className="pt-6">
                {categoriesLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading categories...</span>
                  </div>
                ) : (
                  <div className="mb-6">
                    <div className="flex overflow-x-auto pb-3 mb-2 space-x-2 no-scrollbar">
                      <button 
                        className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all shadow-sm ${
                          selectedTab === "all" 
                            ? "bg-primary text-white shadow" 
                            : "bg-white border border-neutral-200 text-neutral-700 hover:border-primary/30 hover:text-primary"
                        }`}
                        onClick={() => setSelectedTab("all")}
                      >
                        All Items
                      </button>
                      
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all shadow-sm ${
                            selectedTab === category.slug 
                              ? "bg-primary text-white shadow" 
                              : "bg-white border border-neutral-200 text-neutral-700 hover:border-primary/30 hover:text-primary"
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
                  <div className="flex items-center justify-center p-16">
                    <div className="text-center">
                      <svg className="animate-spin h-8 w-8 mx-auto mb-3 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p>Loading menu items...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {menuData.flatMap(category => category.items).map((item) => (
                        <div key={item.id} className="flex border border-neutral-200 rounded-lg overflow-hidden shadow-sm h-full hover:shadow-md transition-shadow">
                          {item.image_url && (
                            <img src={item.image_url} className="w-24 h-full object-cover" alt={item.name} />
                          )}
                          <div className="p-4 flex-1 flex flex-col">
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium text-neutral-800">{item.name}</h3>
                              <span className="font-medium text-primary ml-2">{formatPrice(item.price_cents)}</span>
                            </div>
                            <p className="text-sm text-neutral-600 my-2 flex-grow">{item.description}</p>
                            <div className="flex justify-between items-center mt-auto pt-2">
                              <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full">
                                Prep: {Math.ceil(item.prep_seconds / 60)} min
                              </span>
                              <Button 
                                size="sm"
                                variant="outline"
                                className="px-3 py-1 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                                onClick={() => addToCart({
                                  menuItemId: item.id,
                                  name: item.name,
                                  priceCents: item.price_cents,
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
              
              <TabsContent value="specials" className="pt-6">
                <div className="p-8 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl text-center border border-neutral-200 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 text-primary">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  <h3 className="text-lg font-semibold mb-2">Today's Specials</h3>
                  <p className="text-neutral-600 mb-6">Check back soon for our chef's exclusive daily specials.</p>
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="M12 2L2 7l10 5 10-5-10-5Z"></path>
                      <path d="M2 17l10 5 10-5"></path>
                      <path d="M2 12l10 5 10-5"></path>
                    </svg>
                    Coming Soon
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right side - Cart */}
          <div className="w-1/3 overflow-y-auto bg-white border-l border-neutral-100 p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                <path d="M3 6h18"></path>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              Order Summary
            </h3>
            
            {cart.items.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 text-neutral-400">
                  <circle cx="8" cy="21" r="1"></circle>
                  <circle cx="19" cy="21" r="1"></circle>
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                </svg>
                <p>Your cart is empty</p>
                <p className="text-sm mt-1">Add items from the menu to get started</p>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {cart.items.map((item) => (
                  <div key={item.menuItemId} className="bg-neutral-50 rounded-lg p-3 border border-neutral-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-neutral-800">{item.name}</p>
                      <div className="flex items-center ml-2 bg-primary/10 text-primary text-sm font-medium px-2 py-0.5 rounded">
                        {formatPrice(item.priceCents)}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center border rounded-lg bg-white shadow-sm overflow-hidden">
                        <button 
                          className="px-2.5 py-1.5 bg-white hover:bg-neutral-100 transition-colors border-r"
                          onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button 
                          className="px-2.5 py-1.5 bg-white hover:bg-neutral-100 transition-colors border-l"
                          onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                        </button>
                      </div>
                      <div className="text-neutral-600 text-sm font-medium">
                        Item total: {formatPrice(item.priceCents * item.quantity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mb-6">
              <label className="flex items-center gap-2 mb-2 text-sm font-medium text-neutral-800">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Special Instructions
              </label>
              <Textarea 
                placeholder="Any special requests or allergies?"
                value={cart.specialInstructions || ""}
                onChange={(e) => updateSpecialInstructions(e.target.value)}
                className="w-full border-neutral-200 focus:border-primary/30 focus:ring-primary/20 resize-none"
                rows={3}
              />
            </div>
            
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 mt-6">
              <div className="flex justify-between mb-2 text-neutral-600">
                <span>Items:</span>
                <span className="font-medium">{totalItems}</span>
              </div>
              <div className="flex justify-between text-xl mb-2">
                <span className="font-bold text-neutral-800">Total:</span>
                <span className="font-bold text-primary">{formatPrice(totalPrice)}</span>
              </div>
              <div className="text-xs text-neutral-500 text-right">
                Estimated preparation time: {Math.ceil(totalTime / 60)} min
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-auto py-4 px-6 border-t shadow-sm bg-white flex items-center justify-between">
          <button 
            className="px-4 py-2.5 border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-50 transition-all shadow-sm font-medium flex items-center"
            onClick={() => onOpenChange(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
              <path d="m15 18-6-6 6-6"></path>
            </svg>
            Cancel Order
          </button>
          <div className="flex items-center">
            {cart.items.length > 0 && (
              <div className="mr-4 text-sm text-neutral-500">
                <span className="font-medium text-neutral-800">{totalItems}</span> item{totalItems !== 1 ? "s" : ""} in cart
              </div>
            )}
            <button 
              className="px-5 py-2.5 bg-primary text-white rounded-lg disabled:opacity-50 hover:brightness-110 transition-all font-semibold shadow-sm flex items-center"
              onClick={placeOrder}
              disabled={isSubmitting || cart.items.length === 0 || !selectedBay}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                  Place Order
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}