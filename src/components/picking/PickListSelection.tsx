
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Package, Clock, CheckCircle } from "lucide-react";
import { PickList, PickListStatus } from "../../pages/PickList";

interface PickListSelectionProps {
  onSelectPickList: (pickList: PickList) => void;
  onCreateNew: () => void;
}

const PickListSelection = ({ onSelectPickList, onCreateNew }: PickListSelectionProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data
  const mockPickLists: PickList[] = [
    {
      name: "STO-PICK-2025-00009",
      number: "STO-PICK-2025-00009",
      purpose: "Material Transfer",
      relatedDocument: "MAT-MR-2025-00005",
      status: "Draft",
      company: "Default Company",
      docstatus: 0,
      creation: "2025-05-29 15:10:13.443915",
      createdDate: "2025-05-29 15:10:13.443915",
      owner: "Administrator",
      items: []
    },
    {
      name: "STO-PICK-2025-00008", 
      number: "STO-PICK-2025-00008",
      purpose: "Delivery",
      relatedDocument: "SO-2025-00012",
      status: "Draft",
      company: "Default Company",
      docstatus: 0,
      creation: "2025-05-29 15:10:01.028773",
      createdDate: "2025-05-29 15:10:01.028773",
      owner: "Administrator",
      items: []
    },
    {
      name: "STO-PICK-2025-00006",
      number: "STO-PICK-2025-00006",
      purpose: "Manufacturing",
      relatedDocument: "WO-2025-00003",
      status: "Open",
      company: "Default Company",
      docstatus: 1,
      creation: "2025-05-29 10:57:19.947189",
      createdDate: "2025-05-29 10:57:19.947189",
      owner: "Administrator",
      items: []
    },
    {
      name: "STO-PICK-2025-00007",
      number: "STO-PICK-2025-00007",
      purpose: "Material Transfer",
      relatedDocument: "MAT-MR-2025-00004",
      status: "Completed",
      company: "Default Company",
      docstatus: 1,
      creation: "2025-05-29 10:57:09.175952",
      createdDate: "2025-05-29 10:57:09.175952",
      owner: "Administrator",
      items: []
    }
  ];

  const getStatusColor = (status: PickListStatus) => {
    switch (status) {
      case 'Draft': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: PickListStatus) => {
    switch (status) {
      case 'Draft': return <Package className="w-3 h-3" />;
      case 'Open': return <Clock className="w-3 h-3" />;
      case 'Completed': return <CheckCircle className="w-3 h-3" />;
      default: return <Package className="w-3 h-3" />;
    }
  };

  const filteredPickLists = mockPickLists.filter(pickList =>
    (pickList.number || pickList.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
    (pickList.relatedDocument || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const draftPickLists = filteredPickLists.filter(p => p.status === 'Draft');
  const inProgressPickLists = filteredPickLists.filter(p => p.status === 'Open');
  const completedPickLists = filteredPickLists.filter(p => p.status === 'Completed');

  const renderPickListCard = (pickList: PickList) => (
    <Card 
      key={pickList.name} 
      className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500"
      onClick={() => onSelectPickList(pickList)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Package className="w-4 h-4 text-gray-600" />
            <span className="font-semibold text-gray-900">{pickList.number || pickList.name}</span>
          </div>
          <Badge className={`${getStatusColor(pickList.status || 'Draft')} flex items-center space-x-1`}>
            {getStatusIcon(pickList.status || 'Draft')}
            <span className="capitalize">{(pickList.status || 'Draft').replace('-', ' ')}</span>
          </Badge>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div>
            <span className="font-medium">Purpose:</span> {pickList.purpose}
          </div>
          <div>
            <span className="font-medium">Related Document:</span> {pickList.relatedDocument || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Created:</span> {new Date(pickList.createdDate || pickList.creation).toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Search and Create New */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search pick lists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={onCreateNew} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Create New</span>
        </Button>
      </div>

      {/* Tabs for different statuses */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center space-x-2">
            <Package className="w-4 h-4" />
            <span>Pending ({draftPickLists.length})</span>
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>In Progress ({inProgressPickLists.length})</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Completed ({completedPickLists.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <div className="space-y-4">
            {draftPickLists.length > 0 ? (
              draftPickLists.map(renderPickListCard)
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No pending pick lists found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="in-progress" className="mt-6">
          <div className="space-y-4">
            {inProgressPickLists.length > 0 ? (
              inProgressPickLists.map(renderPickListCard)
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No pick lists in progress</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div className="space-y-4">
            {completedPickLists.length > 0 ? (
              completedPickLists.map(renderPickListCard)
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No completed pick lists found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PickListSelection;
