import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Package2, Calendar, User, FileText, Truck, Plus, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { PackingSlip } from "../../pages/Packing";

interface PackingSlipListProps {
  onCreateNew: (deliveryNote?: string) => void;
}

const PackingSlipList = ({ onCreateNew }: PackingSlipListProps) => {
  const [packingSlips, setPackingSlips] = useState<any[]>([]);
  const [filteredPackingSlips, setFilteredPackingSlips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deliveryNoteSearch, setDeliveryNoteSearch] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchPackingSlips();
  }, []);

  useEffect(() => {
    // Handle search filtering
    if (searchTerm.trim() === "") {
      setFilteredPackingSlips(packingSlips);
    } else {
      // Search directly in ERPNext with higher limit
      fetchPackingSlips(searchTerm.trim());
    }
  }, [searchTerm]);

  const fetchPackingSlips = async (searchTerm?: string) => {
    try {
      setLoading(true);
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

      const filters: any[] = [];
      
      // Add search filter if search term provided
      if (searchTerm) {
        filters.push(['name', 'like', `%${searchTerm}%`]);
      }
      
      // Get packing slips with last 5 records sorted by creation date
      const result = await api.getPackingSlips(
        filters.length > 0 ? filters : undefined,
        company || undefined,
        searchTerm ? 50 : 5,
        'creation desc'
      );
      
      if (result && result.data) {
        const sortedData = result.data.sort((a: any, b: any) => 
          new Date(b.creation).getTime() - new Date(a.creation).getTime()
        );
        
        const processedSlips = sortedData.map((slip: any) => ({
          ...slip,
          id: slip.name,
          number: slip.name,
          status: slip.docstatus === 0 ? 'Draft' : slip.docstatus === 1 ? 'Submitted' : 'Cancelled'
        }));
        
        if (searchTerm) {
          setFilteredPackingSlips(processedSlips);
          setPackingSlips(processedSlips);
        } else {
          setPackingSlips(processedSlips);
          setFilteredPackingSlips(processedSlips);
        }
      } else {
        setPackingSlips([]);
        setFilteredPackingSlips([]);
      }
    } catch (error) {
      console.error('Error fetching packing slips:', error);
      toast({
        title: "Error",
        description: "Failed to fetch packing slips",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Mock delivery notes - in real implementation, these would come from ERPNext
  const mockDeliveryNotes = [
    { number: "DN-2024-003", customer: "Tech Solutions Inc", status: "Ready for Packing" },
    { number: "DN-2024-004", customer: "Modern Systems", status: "Ready for Packing" },
    { number: "DN-2024-005", customer: "Digital Corp", status: "Ready for Packing" }
  ];

  const filteredDeliveryNotes = mockDeliveryNotes.filter(note =>
    note.number.toLowerCase().includes(deliveryNoteSearch.toLowerCase()) ||
    note.customer.toLowerCase().includes(deliveryNoteSearch.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
      case "Submitted":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "Cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading packing slips...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create from Delivery Note */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Truck className="w-5 h-5" />
            <span>Create Packing Slip from Delivery Note</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="deliveryNoteSearch">Search Delivery Notes</Label>
              <Input
                id="deliveryNoteSearch"
                value={deliveryNoteSearch}
                onChange={(e) => setDeliveryNoteSearch(e.target.value)}
                placeholder="Enter delivery note number or customer..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDeliveryNotes.map((note) => (
                <Card key={note.number} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{note.number}</h4>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                          {note.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{note.customer}</p>
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => onCreateNew(note.number)}
                      >
                        Create Packing Slip
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Recent Packing Slips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>{searchTerm ? `Search Results (${filteredPackingSlips.length})` : `Recent Packing Slips (${filteredPackingSlips.length})`}</span>
            </div>
            <Button onClick={() => fetchPackingSlips()} variant="outline" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardTitle>
          {!searchTerm && (
            <p className="text-sm text-muted-foreground">
              Showing last 5 records - use search to find more
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter packing slip number, delivery note, or customer name..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Packing Slips List */}
      {filteredPackingSlips.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPackingSlips.map((slip) => (
            <Card key={slip.id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{slip.number}</CardTitle>
                  <Badge className={getStatusColor(slip.status)}>
                    {slip.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{slip.delivery_note || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{formatDate(slip.creation)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{slip.customer || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Package2 className="w-4 h-4 text-muted-foreground" />
                    <span>{slip.total_packages || 0} packages</span>
                  </div>
                </div>

                {slip.total_weight && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Total Weight:</span>
                    <span className="font-medium ml-2">{slip.total_weight} kg</span>
                  </div>
                )}
                
                {slip.shipping_address && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Shipping Address:</span>
                    <p className="text-foreground mt-1">{slip.shipping_address}</p>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  <Button size="sm">
                    Print Label
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "No packing slips found matching your search criteria." : "No packing slips found"}
            </p>
            <Button onClick={() => onCreateNew()}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Packing Slip
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PackingSlipList;