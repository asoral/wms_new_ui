
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Package2, Calendar, User, FileText, Truck } from "lucide-react";
import { PackingSlip } from "../../pages/Packing";

interface PackingSlipListProps {
  onCreateNew: (deliveryNote?: string) => void;
}

const PackingSlipList = ({ onCreateNew }: PackingSlipListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [deliveryNoteSearch, setDeliveryNoteSearch] = useState("");

  const mockPackingSlips: PackingSlip[] = [
    {
      id: "1",
      number: "PS-2024-001",
      deliveryNote: "DN-2024-001",
      customer: "ABC Electronics Ltd",
      createdDate: "2024-01-15",
      status: "Draft",
      items: [],
      totalPackages: 3,
      totalWeight: 25.5,
      shippingAddress: "123 Business Park, Mumbai"
    },
    {
      id: "2", 
      number: "PS-2024-002",
      deliveryNote: "DN-2024-002",
      customer: "XYZ Corporation",
      createdDate: "2024-01-14",
      status: "Submitted",
      items: [],
      totalPackages: 2,
      totalWeight: 18.2,
      shippingAddress: "456 Industrial Area, Delhi"
    }
  ];

  const mockDeliveryNotes = [
    { number: "DN-2024-003", customer: "Tech Solutions Inc", status: "Ready for Packing" },
    { number: "DN-2024-004", customer: "Modern Systems", status: "Ready for Packing" },
    { number: "DN-2024-005", customer: "Digital Corp", status: "Ready for Packing" }
  ];

  const filteredPackingSlips = mockPackingSlips.filter(slip =>
    slip.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    slip.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    slip.deliveryNote.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDeliveryNotes = mockDeliveryNotes.filter(note =>
    note.number.toLowerCase().includes(deliveryNoteSearch.toLowerCase()) ||
    note.customer.toLowerCase().includes(deliveryNoteSearch.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800";
      case "Submitted":
        return "bg-green-100 text-green-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

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
                        <Badge className="bg-blue-100 text-blue-800">
                          {note.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{note.customer}</p>
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

      {/* Search Existing Packing Slips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Search Packing Slips</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter packing slip number, delivery note, or customer name..."
          />
        </CardContent>
      </Card>

      {/* Packing Slips List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredPackingSlips.map((slip) => (
          <Card key={slip.id} className="hover:shadow-md transition-shadow">
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
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{slip.deliveryNote}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>{new Date(slip.createdDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>{slip.customer}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Package2 className="w-4 h-4 text-gray-500" />
                  <span>{slip.totalPackages} packages</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-gray-600">Total Weight:</span>
                  <span className="font-medium ml-2">{slip.totalWeight} kg</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Shipping Address:</span>
                  <p className="text-gray-900 mt-1">{slip.shippingAddress}</p>
                </div>
              </div>

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

      {filteredPackingSlips.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No packing slips found matching your search criteria.
        </div>
      )}
    </div>
  );
};

export default PackingSlipList;
