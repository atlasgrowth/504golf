import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BayStatusContainer, BayStatusBadge } from "@/components/ui/bay-status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function BaySelection() {
  const [selectedFloor, setSelectedFloor] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredBays, setFilteredBays] = useState<any[]>([]);
  
  // Fetch all bays
  const { data: bays, isLoading } = useQuery({
    queryKey: ['/api/bays'],
  });
  
  // Filter bays based on selected criteria
  useEffect(() => {
    if (!bays) return;
    
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
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h2 className="font-poppins font-semibold text-lg mb-3">Bay Selection</h2>
      <div className="flex space-x-4 mb-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700 mb-1">Floor</label>
          <Select value={selectedFloor} onValueChange={setSelectedFloor}>
            <SelectTrigger>
              <SelectValue placeholder="All Floors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Floors</SelectItem>
              <SelectItem value="1">Floor 1</SelectItem>
              <SelectItem value="2">Floor 2</SelectItem>
              <SelectItem value="3">Floor 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700 mb-1">Bay Status</label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active Orders</SelectItem>
              <SelectItem value="empty">No Orders</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
              <SelectItem value="alert">Attention Needed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700 mb-1">Search</label>
          <Input 
            type="text" 
            placeholder="Search by bay #" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <div className="grid grid-cols-10 gap-2">
          {filteredBays.map((bay) => (
            <BayStatusContainer 
              key={bay.id} 
              status={bay.status}
            >
              <span className="font-medium">{formatBayNumber(bay.number)}</span>
              <BayStatusBadge status={bay.status} />
            </BayStatusContainer>
          ))}
        </div>
      )}
    </div>
  );
}
