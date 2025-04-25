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
    <div className="mb-6 rounded-lg border border-emerald-200 bg-white shadow-lg overflow-hidden">
      {/* Header with golf-themed gradient */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-4 flex items-center justify-between">
        <h2 className="font-poppins font-bold text-xl text-white flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Bay Selection
        </h2>
        <div className="text-white text-sm bg-emerald-700 px-3 py-1 rounded-full">
          Five O Four Golf
        </div>
      </div>
      
      {/* Filter controls */}
      <div className="p-5 bg-gradient-to-b from-gray-50 to-white">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-emerald-800 mb-1.5">Floor</label>
            <Select value={selectedFloor} onValueChange={setSelectedFloor}>
              <SelectTrigger className="bg-white border-emerald-200 hover:border-emerald-400 transition-colors">
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
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-emerald-800 mb-1.5">Bay Status</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="bg-white border-emerald-200 hover:border-emerald-400 transition-colors">
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
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-emerald-800 mb-1.5">Search</label>
            <Input 
              type="text" 
              placeholder="Search by bay #" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border-emerald-200 hover:border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Bay grid */}
      <div className="p-5 bg-gray-50 border-t border-emerald-100">
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {filteredBays.map((bay) => (
              <div 
                key={bay.id}
                className={`
                  relative group cursor-pointer rounded-md overflow-hidden
                  transition-transform hover:scale-105 hover:shadow-md
                  flex flex-col items-center justify-center 
                  ${bay.status === 'active' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' : 
                    bay.status === 'flagged' ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' :
                    bay.status === 'alert' ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white' :
                    'bg-white border-2 border-emerald-200 text-emerald-800 hover:border-emerald-400'}
                  py-4 h-20
                `}
              >
                <div className="absolute -top-1 -right-1 bg-white rounded-bl-md px-1.5 py-0.5 text-xs font-medium text-emerald-800 border-b border-l border-emerald-200">
                  {bay.floor}F
                </div>
                <span className="text-xl font-bold">{formatBayNumber(bay.number)}</span>
                <div className="mt-1">
                  <BayStatusBadge status={bay.status} />
                </div>
                
                {/* Hover effect with golf ball */}
                <div className="absolute inset-0 bg-emerald-900 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <div className="absolute -bottom-6 -right-6 w-12 h-12 bg-white rounded-full opacity-0 group-hover:opacity-10 transition-opacity"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}