
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { StockEntryType } from "../../pages/StockEntry";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileStockEntryCard from "./MobileStockEntryCard";

interface StockEntryListProps {
  onCreateNew: (type: StockEntryType) => void;
}

const StockEntryList = ({ onCreateNew }: StockEntryListProps) => {
  const [stockEntries, setStockEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchStockEntries();
  }, []);

  const fetchStockEntries = async () => {
    setIsLoading(true);
    try {
      const api = await createERPNextAPI();
      const company = await getUserDefaultCompany();
      
      if (!api) {
        toast({
          title: "ERPNext Connection Error",
          description: "Please configure ERPNext settings",
          variant: "destructive"
        });
        return;
      }

      const result = await api.getStockEntries(undefined, company || undefined, 50);
      if (result && result.data) {
        setStockEntries(result.data);
      }
    } catch (error) {
      console.error('Error fetching stock entries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch stock entries from ERPNext",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEntries = stockEntries.filter(entry => {
    const matchesSearch = entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.stock_entry_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === "all") return matchesSearch;
    
    const statusMap: Record<string, number> = {
      "draft": 0,
      "submitted": 1,
      "cancelled": 2
    };
    
    return matchesSearch && entry.docstatus === statusMap[filterStatus];
  });

  const getStatusBadge = (docstatus: number) => {
    switch (docstatus) {
      case 0:
        return <Badge variant="secondary">Draft</Badge>;
      case 1:
        return <Badge variant="default">Submitted</Badge>;
      case 2:
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading stock entries...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search stock entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Button onClick={fetchStockEntries} variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Entries List */}
      {filteredEntries.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Stock Entries ({filteredEntries.length})</span>
              <Button onClick={() => onCreateNew("Material Receipt")} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Entry
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isMobile ? (
              <div className="space-y-4">
                {filteredEntries.map((entry, index) => (
                  <MobileStockEntryCard
                    key={index}
                    entry={entry}
                    onView={(entry) => console.log('View entry:', entry)}
                    onEdit={(entry) => console.log('Edit entry:', entry)}
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border">Entry Number</th>
                      <th className="text-left p-3 border">Type</th>
                      <th className="text-left p-3 border">Date</th>
                      <th className="text-left p-3 border">Status</th>
                      <th className="text-left p-3 border">Created By</th>
                      <th className="text-left p-3 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3 border font-medium">{entry.name}</td>
                        <td className="p-3 border">{entry.stock_entry_type}</td>
                        <td className="p-3 border">
                          {new Date(entry.creation).toLocaleDateString()}
                        </td>
                        <td className="p-3 border">
                          {getStatusBadge(entry.docstatus)}
                        </td>
                        <td className="p-3 border">{entry.owner}</td>
                        <td className="p-3 border">
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              View
                            </Button>
                            {entry.docstatus === 0 && (
                              <Button size="sm">
                                Edit
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 mb-4">No stock entries found</p>
            <Button onClick={() => onCreateNew("Material Receipt")}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Stock Entry
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StockEntryList;
