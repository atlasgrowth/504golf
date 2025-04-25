import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import qrCode from "@/assets/qr-code.svg";

export default function Home() {
  const [bayNumber, setBayNumber] = useState("");
  
  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center bg-primary text-white rounded-t-lg pb-6">
          <CardTitle className="text-3xl font-poppins">SwingEats</CardTitle>
          <p className="text-primary-foreground mt-1">Golf Facility Food Ordering System</p>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-neutral-800">Select Interface</h2>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Link href="/server">
                <Button className="w-full bg-primary h-12" size="lg">
                  Server View
                </Button>
              </Link>
              <Link href="/kitchen">
                <Button className="w-full bg-primary h-12" size="lg">
                  Kitchen View
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="relative mt-6 pt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-neutral-600">Or access customer view</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bay-number">Bay Number</Label>
              <Input 
                id="bay-number" 
                type="number" 
                placeholder="Enter bay number"
                value={bayNumber}
                onChange={(e) => setBayNumber(e.target.value)} 
              />
            </div>
            
            <Link href={`/customer/${bayNumber}`}>
              <Button 
                className="w-full bg-secondary hover:bg-secondary-dark h-12" 
                size="lg"
                disabled={!bayNumber}
              >
                Go to Customer Menu
              </Button>
            </Link>
          </div>
          
          <div className="mt-6 pt-4 border-t border-neutral-200 text-center">
            <p className="text-sm font-medium text-neutral-600 mb-2">Scan QR code to access menu</p>
            <div className="flex justify-center">
              <img src={qrCode} alt="QR Code for menu" className="w-32 h-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
