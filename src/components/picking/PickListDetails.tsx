
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, ArrowLeft, Package, Calendar, User } from "lucide-react";
import { PickList, PickListPurpose, PickListStatus } from "../../pages/PickList";

interface PickListDetailsProps {
  pickList: PickList;
  onStartPicking: () => void;
  onBack: () => void;
}

const PickListDetails = ({ pickList, onStartPicking, onBack }: PickListDetailsProps) => {
  const mockPickList: PickList = {
    id: "1",
    name: "STO-PICK-2025-00009",
    purpose: "Material Transfer" as PickListPurpose,
    relatedDocument: "MAT-MR-2025-00005",
    status: "Draft" as PickListStatus,
    createdDate: "2025-05-29 15:10:13.443915",
    createdBy: "John Doe",
    company: "Test Company",
    items: [
      {
        itemCode: "ITM-001",
        itemName: "Sample Item",
        qty: 10,
        requiredQty: 10,
        uom: "Nos",
        warehouse: "Main Store",
        status: "pending"
      }
    ]
  };

  const currentPickList = pickList || mockPickList;

  const getStatusColor = (status: PickListStatus) => {
    switch (status) {
      case 'Draft': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPurposeIcon = (purpose: PickListPurpose) => {
    switch (purpose) {
      case 'Material Transfer': return <Package className="w-4 h-4" />;
      case 'Delivery': return <Package className="w-4 h-4" />;
      case 'Manufacturing': return <Package className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{currentPickList.name}</h1>
            <p className="text-gray-600">Pick List Details</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className={getStatusColor(currentPickList.status)}>
            {currentPickList.status}
          </Badge>
          <Button onClick={onStartPicking} className="flex items-center space-x-2">
            <Play className="w-4 h-4" />
            <span>Start Picking</span>
          </Button>
        </div>
      </div>

      {/* Pick List Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getPurposeIcon(currentPickList.purpose)}
            <span>Pick List Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <Package className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Purpose</p>
                <p className="font-medium">{currentPickList.purpose}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Created Date</p>
                <p className="font-medium">{new Date(currentPickList.createdDate).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Created By</p>
                <p className="font-medium">{currentPickList.createdBy}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">Related Document</p>
            <p className="font-medium">{currentPickList.relatedDocument}</p>
          </div>
        </CardContent>
      </Card>

      {/* Items to Pick */}
      <Card>
        <CardHeader>
          <CardTitle>Items to Pick ({currentPickList.items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentPickList.items.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <Package className="w-5 h-5 text-gray-400" />
                    <div>
                      <h4 className="font-medium">{item.itemCode}</h4>
                      <p className="text-sm text-gray-600">{item.itemName}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm">
                          <strong>Qty:</strong> {item.requiredQty} {item.uom}
                        </span>
                        <span className="text-sm">
                          <strong>Warehouse:</strong> {item.warehouse}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <Badge variant={item.status === "pending" ? "secondary" : "default"}>
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PickListDetails;
