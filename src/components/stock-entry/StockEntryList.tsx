
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Search, Plus, Scan } from "lucide-react";
import { StockEntry, StockEntryType, StockEntryStatus } from "../../pages/StockEntry";

interface StockEntryListProps {
  onCreateNew: (type: StockEntryType) => void;
}

const StockEntryList = ({ onCreateNew }: StockEntryListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const entryTypes: StockEntryType[] = [
    "Material Issue",
    "Material Receipt", 
    "Material Transfer",
    "Manufacture",
    "Repack",
    "Send to Subcontractor",
    "Material Transfer for Manufacture",
    "Material Consumption for Manufacture",
    "Receive at Warehouse",
    "Send to Warehouse"
  ];
  
  const statuses: StockEntryStatus[] = ["Draft", "Submitted", "Cancelled"];

  const mockEntries: StockEntry[] = [
    {
      id: "1",
      number: "STE-2024-001",
      type: "Material Issue",
      status: "Draft",
      createdDate: "2024-01-15",
      createdBy: "John Doe",
      items: [],
      totalValue: 125000,
      purpose: "Production consumption"
    },
    {
      id: "2",
      number: "STE-2024-002",
      type: "Material Transfer",
      status: "Submitted",
      createdDate: "2024-01-14",
      createdBy: "Jane Smith",
      items: [],
      totalValue: 89000,
      purpose: "Warehouse transfer"
    }
  ];

  const filteredEntries = mockEntries.filter(entry =>
    entry.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: StockEntryStatus) => {
    const colors: Record<StockEntryStatus, string> = {
      "Draft": "bg-gray-100 text-gray-800",
      "Submitted": "bg-green-100 text-green-800",
      "Cancelled": "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getEntriesByTypeAndStatus = (type: StockEntryType, status: StockEntryStatus) => {
    return filteredEntries.filter(entry => entry.type === type && entry.status === status);
  };

  const handleScanSearch = () => {
    // Simulate scanning a stock entry number
    setSearchTerm("STE-2024-001");
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Search Stock Entries</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter stock entry number or creator name..."
              className="flex-1"
            />
            <Button variant="outline" onClick={handleScanSearch}>
              <Scan className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Create Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Stock Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {entryTypes.slice(0, 6).map((type) => (
              <Button
                key={type}
                variant="outline"
                onClick={() => onCreateNew(type)}
                className="h-16 flex-col text-center p-2"
              >
                <Plus className="w-4 h-4 mb-1" />
                <span className="text-xs">{type}</span>
              </Button>
            ))}
          </div>
          
          {/* Show More Button */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full mt-2">
                <ChevronDown className="w-4 h-4 mr-2" />
                Show More Entry Types
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                {entryTypes.slice(6).map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    onClick={() => onCreateNew(type)}
                    className="h-16 flex-col text-center p-2"
                  >
                    <Plus className="w-4 h-4 mb-1" />
                    <span className="text-xs">{type}</span>
                  </Button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Stock Entries by Type */}
      <div className="space-y-4">
        {entryTypes.map((type) => {
          const typeEntries = filteredEntries.filter(e => e.type === type);
          if (typeEntries.length === 0) return null;

          return (
            <Card key={type}>
              <Collapsible
                open={openSections[type]}
                onOpenChange={() => toggleSection(type)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50">
                    <CardTitle className="flex items-center justify-between">
                      <span>{type}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          {typeEntries.length}
                        </Badge>
                        <ChevronDown className={`w-4 h-4 transition-transform ${openSections[type] ? 'rotate-180' : ''}`} />
                      </div>
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {statuses.map((status) => {
                        const entries = getEntriesByTypeAndStatus(type, status);
                        if (entries.length === 0) return null;

                        return (
                          <Collapsible key={status}>
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                                <div className="flex items-center space-x-2">
                                  <Badge className={getStatusColor(status)}>
                                    {status}
                                  </Badge>
                                  <span className="text-sm font-medium">{entries.length} entries</span>
                                </div>
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent>
                              <div className="mt-2 space-y-2">
                                {entries.map((entry) => (
                                  <div key={entry.id} className="p-3 bg-white border rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h4 className="font-medium">{entry.number}</h4>
                                        <p className="text-sm text-gray-600">Created by: {entry.createdBy}</p>
                                        <p className="text-sm text-gray-600">Date: {new Date(entry.createdDate).toLocaleDateString()}</p>
                                        {entry.purpose && (
                                          <p className="text-sm text-gray-600">Purpose: {entry.purpose}</p>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        {entry.totalValue && (
                                          <p className="font-semibold">₹{entry.totalValue.toLocaleString()}</p>
                                        )}
                                        <Button size="sm" variant="outline">
                                          View Details
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default StockEntryList;
