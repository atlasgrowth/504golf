import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BayStatusContainer, BayStatusBadge } from "@/components/ui/bay-status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Bay {
  id: number;
  number: number;
  floor: number;
  status: string;
}

interface BaySelectionProps {
  onSelectBay?: (bay: Bay) => void;
  onCreateOrder?: (bayId: number) => void;
}

export default function BaySelection({ onSelectBay, onCreateOrder }: BaySelectionProps = {}) {
  const [selectedFloor, setSelectedFloor] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredBays, setFilteredBays] = useState<Bay[]>([]);
  const [selectedBay, setSelectedBay] = useState<Bay | null>(null);
  const [bayActionDialog, setBayActionDialog] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch all bays
  const { data: bays = [], isLoading } = useQuery<Bay[]>({
    queryKey: ['/api/bays'],
  });
  
  // Get floors from bays data
  const floors = [...new Set(bays.map(bay => bay.floor))].sort();
  
  // Get unique statuses from bays data
  const statuses = [...new Set(bays.map(bay => bay.status))];
  
  // Filter bays based on selected criteria
  useEffect(() => {
    if (!bays.length) return;
    
    let filtered = [...bays];
    
    // Filter by floor
    if (selectedFloor !== "all") {
      filtered = filtered.filter(bay => bay.floor === parseInt(selectedFloor));
    }
    
    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(bay => bay.status === selectedStatus);
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(bay => 
        bay.number.toString().includes(searchQuery)
      );
    }
    
    setFilteredBays(filtered);
  }, [bays, selectedFloor, selectedStatus, searchQuery]);
  
  // Format bay number to always be two digits
  const formatBayNumber = (number: number) => {
    return number.toString().padStart(2, '0');
  };
  
  // Handle bay click
  const handleBayClick = (bay: Bay) => {
    setSelectedBay(bay);
    setBayActionDialog(true);
  };
  
  // Handle view order
  const handleViewOrder = () => {
    if (selectedBay && onSelectBay) {
      onSelectBay(selectedBay);
      setBayActionDialog(false);
    }
  };
  
  // Handle create new order
  const handleCreateOrder = () => {
    if (selectedBay && onCreateOrder) {
      onCreateOrder(selectedBay.id);
      setBayActionDialog(false);
      
      toast({
        title: "Creating new order",
        description: `Starting new order for Bay ${selectedBay.number}`,
      });
    }
  };
  
  return (
    <div className="glassmorphism rounded-xl shadow-md p-5 mb-6">
      <h2 className="text-xl font-bold mb-5 flex items-center">
        <span className="bg-primary/10 p-2 rounded-full mr-2">
          <ClipboardList className="h-5 w-5 text-primary" />
        </span>
        Bay Selection
      </h2>
      
      <Tabs defaultValue="all" className="mb-6">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all" onClick={() => setSelectedFloor("all")}>All Floors</TabsTrigger>
          {floors.map(floor => (
            <TabsTrigger 
              key={floor} 
              value={floor.toString()} 
              onClick={() => setSelectedFloor(floor.toString())}
            >
              Floor {floor}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <div className="flex space-x-4 mb-6">
          <div className="flex-1">
            <Select
              value={selectedStatus}
              onValueChange={setSelectedStatus}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center">
                      <BayStatusBadge status={status} />
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Input 
              placeholder="Search by bay number..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10"
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10 gap-3">
            {Array(20).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10 gap-3">
            {filteredBays.map((bay) => (
              <BayStatusContainer 
                key={bay.id} 
                status={bay.status}
                onClick={() => handleBayClick(bay)}
              >
                {formatBayNumber(bay.number)}
              </BayStatusContainer>
            ))}
            
            {filteredBays.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No bays match your selection criteria
              </div>
            )}
          </div>
        )}
      </Tabs>
      
      {/* Bay Action Dialog */}
      <Dialog open={bayActionDialog} onOpenChange={setBayActionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bay {selectedBay?.number}</DialogTitle>
            <DialogDescription>
              {selectedBay?.status === 'empty' 
                ? 'This bay is currently available.' 
                : 'This bay has an active order.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center py-4">
            <BayStatusContainer status={selectedBay?.status || 'empty'}>
              {selectedBay?.number ? formatBayNumber(selectedBay.number) : ''}
            </BayStatusContainer>
          </div>
          
          <DialogFooter className="sm:justify-start gap-3">
            {selectedBay?.status !== 'empty' && (
              <Button 
                variant="default" 
                className="flex-1"
                onClick={handleViewOrder}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Order
              </Button>
            )}
            
            <Button 
              variant={selectedBay?.status !== 'empty' ? "outline" : "default"}
              className="flex-1"
              onClick={handleCreateOrder}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
