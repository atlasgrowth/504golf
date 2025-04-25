import { useState } from "react";
import { useOrder } from "@/contexts/OrderContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface OrderSummaryProps {
  bayNumber: number;
}

export default function OrderSummary({ bayNumber }: OrderSummaryProps) {
  const { cart, totalItems, totalPrice, updateQuantity, removeFromCart, updateSpecialInstructions, clearCart } = useOrder();
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Format price from cents to dollars
  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };
  
  const placeOrder = async () => {
    try {
      setIsSubmitting(true);
      
      // Get bay ID from bay number
      const bayResponse = await fetch(`/api/bay/${bayNumber}`);
      const bay = await bayResponse.json();
      
      if (!bay || !bay.id) {
        throw new Error(`Bay ${bayNumber} not found`);
      }
      
      // Create order
      const orderData = {
        order: {
          orderNumber: "", // Will be generated server-side
          bayId: bay.id,
          status: "pending",
          orderType: "customer",
          specialInstructions: cart.specialInstructions || "",
        },
        cart
      };
      
      const response = await apiRequest('POST', '/api/orders', orderData);
      const newOrder = await response.json();
      
      clearCart();
      setOrderDialogOpen(false);
      
      toast({
        title: "Order Placed",
        description: `Your order #${newOrder.orderNumber} has been placed successfully!`,
      });
    } catch (error) {
      console.error("Failed to place order:", error);
      toast({
        title: "Order Failed",
        description: "There was an error placing your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="border-t border-neutral-200 pt-4">
      <div className="flex justify-between items-center">
        <h2 className="font-poppins font-semibold text-lg">Your Order ({totalItems} items)</h2>
        <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
          <DialogTrigger asChild>
            <button 
              className="text-sm text-primary font-medium"
              disabled={totalItems === 0}
            >
              View details
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Your Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {cart.items.map((item) => (
                <div key={item.menuItemId} className="flex justify-between items-center border-b pb-2">
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-neutral-600">{formatPrice(item.priceCents)} each</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      className="px-2 py-1 bg-neutral-200 rounded-md"
                      onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button 
                      className="px-2 py-1 bg-neutral-200 rounded-md"
                      onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                    >
                      +
                    </button>
                    <button 
                      className="text-danger ml-2"
                      onClick={() => removeFromCart(item.menuItemId)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              
              <div>
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
              
              <div className="flex justify-between font-medium text-lg pt-2">
                <span>Total:</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              
              <div className="flex space-x-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setOrderDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-primary hover:bg-primary-dark" 
                  onClick={placeOrder}
                  disabled={isSubmitting || totalItems === 0}
                >
                  {isSubmitting ? "Submitting..." : "Confirm Order"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex justify-between items-center mt-3 mb-4">
        <span className="text-neutral-700">Total:</span>
        <span className="font-poppins font-bold text-xl">{formatPrice(totalPrice)}</span>
      </div>
      <button 
        className="w-full py-3 bg-primary text-white font-poppins font-medium rounded-lg shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
        disabled={totalItems === 0 || isSubmitting}
        onClick={placeOrder}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 12h-3a2 2 0 0 1-2-2V7"></path>
          <path d="M14 3.5v7"></path>
          <path d="M21 3v7"></path>
          <path d="M21 12v2a6 6 0 0 1-6 6c-1.57 0-2.94-.81-3.75-2.03"></path>
          <path d="M7.5 9H4.5C3.12 9 2 10.12 2 11.5s1.12 2.5 2.5 2.5H7l1.48-4.5"></path>
          <path d="M11.5 14H9.83c-1.38 0-2.5 1.12-2.5 2.5S8.45 19 9.83 19h1.67l1.5-5"></path>
        </svg>
        <span>{isSubmitting ? "Submitting..." : "Place Order"}</span>
      </button>
    </div>
  );
}
