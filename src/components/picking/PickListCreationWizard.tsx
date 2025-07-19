
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Package, FileText, Truck, Cog } from "lucide-react";
import { createERPNextAPI, getUserDefaultCompany } from "@/services/erpnextApi";
import { useToast } from "@/hooks/use-toast";

interface PickListCreationWizardProps {
  onBack: () => void;
  onComplete: (pickListData: any) => void;
}

type PickListType = "Delivery" | "Material Transfer" | "Manufacturing";
type Step = 1 | 2 | 3;

interface DocumentOption {
  id: string;
  name: string;
  customer?: string;
  date: string;
  itemCount?: number;
}

const PickListCreationWizard = ({ onBack, onComplete }: PickListCreationWizardProps) => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedType, setSelectedType] = useState<PickListType | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentOption | null>(null);
  const [documents, setDocuments] = useState<DocumentOption[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isCreatingPickList, setIsCreatingPickList] = useState(false);
  const { toast } = useToast();

  const pickListTypes = [
    {
      type: "Delivery" as PickListType,
      icon: Truck,
      title: "Delivery",
      description: "Pick items for customer delivery",
      color: "bg-blue-100 text-blue-800 border-blue-200"
    },
    {
      type: "Material Transfer" as PickListType,
      icon: Package,
      title: "Material Transfer",
      description: "Transfer items between warehouses",
      color: "bg-green-100 text-green-800 border-green-200"
    },
    {
      type: "Manufacturing" as PickListType,
      icon: Cog,
      title: "Manufacturing",
      description: "Pick raw materials for production",
      color: "bg-purple-100 text-purple-800 border-purple-200"
    }
  ];

  // Fetch documents from ERPNext based on selected type
  const fetchDocuments = async (type: PickListType) => {
    setIsLoadingDocuments(true);
    try {
      const api = await createERPNextAPI();
      const company = await getUserDefaultCompany();
      
      if (!api) {
        toast({
          title: "ERPNext Connection Error",
          description: "Please configure ERPNext settings in your profile",
          variant: "destructive"
        });
        return;
      }

      let documentsData = [];
      
      switch (type) {
        case "Delivery":
          const salesOrders = await api.getSalesOrders(
            [['status', 'in', ['To Deliver and Bill', 'To Deliver']]],
            company || undefined,
            20
          );
          documentsData = salesOrders.data.map((so: any) => ({
            id: so.name,
            name: so.name,
            customer: so.customer,
            date: so.transaction_date,
            itemCount: so.total_qty || 0
          }));
          break;
          
        case "Material Transfer":
          // Get material requests with fields that include items count
          const materialRequests = await api.getMaterialRequests([
            ['material_request_type', '=', 'Material Transfer'], 
            ['status', '!=', 'Cancelled'],
            ['docstatus', '=', '1']
          ], company, 20);
          
          console.log('Material Requests Response:', materialRequests);
          
          // Get detailed information for each material request to count items
          const mrList = (materialRequests as any)?.data?.data || (materialRequests as any)?.data || [];
          const detailedRequests = await Promise.all(
            mrList.map(async (mr: any) => {
              try {
                const detailResponse = await api.getMaterialRequest(mr.name);
                const detailData = (detailResponse as any)?.data?.data || (detailResponse as any)?.data;
                const itemCount = detailData?.items?.length || 0;
                console.log(`Material Request ${mr.name} has ${itemCount} items`);
                
                return {
                  id: mr.name,
                  name: mr.name,
                  date: mr.transaction_date || mr.creation,
                  itemCount: itemCount
                };
              } catch (error) {
                console.error(`Error fetching details for ${mr.name}:`, error);
                return {
                  id: mr.name,
                  name: mr.name,
                  date: mr.transaction_date || mr.creation,
                  itemCount: 0
                };
              }
            })
          );
          
          documentsData = detailedRequests;
          console.log('Final documents data for Material Transfer:', documentsData);
          break;
          
        case "Manufacturing":
          // For manufacturing, we would typically fetch Work Orders
          // For now, using mock data as Work Order API might not be implemented
          documentsData = [
            { id: "WO-2025-00001", name: "WO-2025-00001", date: "2025-01-02", itemCount: 22 },
            { id: "WO-2025-00002", name: "WO-2025-00002", date: "2025-01-03", itemCount: 18 }
          ];
          break;
      }
      
      setDocuments(documentsData);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error Loading Documents",
        description: "Failed to load documents from ERPNext",
        variant: "destructive"
      });
      // Fallback to mock data
      setDocuments(getMockDocuments(type));
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  // Mock document options as fallback
  const getMockDocuments = (type: PickListType): DocumentOption[] => {
    switch (type) {
      case "Delivery":
        return [
          { id: "SO-2025-00012", name: "SO-2025-00012", customer: "ABC Corp", date: "2025-01-03", itemCount: 8 },
          { id: "SO-2025-00013", name: "SO-2025-00013", customer: "XYZ Ltd", date: "2025-01-03", itemCount: 12 },
          { id: "SO-2025-00014", name: "SO-2025-00014", customer: "Tech Solutions", date: "2025-01-04", itemCount: 6 }
        ];
      case "Material Transfer":
        return [
          { id: "MAT-MR-2025-00005", name: "MAT-MR-2025-00005", date: "2025-01-02", itemCount: 15 },
          { id: "MAT-MR-2025-00006", name: "MAT-MR-2025-00006", date: "2025-01-03", itemCount: 9 },
          { id: "MAT-MR-2025-00007", name: "MAT-MR-2025-00007", date: "2025-01-03", itemCount: 11 }
        ];
      case "Manufacturing":
        return [
          { id: "WO-2025-00001", name: "WO-2025-00001", date: "2025-01-02", itemCount: 22 },
          { id: "WO-2025-00002", name: "WO-2025-00002", date: "2025-01-03", itemCount: 18 },
          { id: "WO-2025-00003", name: "WO-2025-00003", date: "2025-01-04", itemCount: 14 }
        ];
      default:
        return [];
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && selectedType) {
      fetchDocuments(selectedType);
      setCurrentStep(2);
    } else if (currentStep === 2 && selectedDocument) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep === 1) {
      onBack();
    } else {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleCreatePickList = async () => {
    if (selectedType && selectedDocument) {
      setIsCreatingPickList(true);
      try {
        const api = await createERPNextAPI();
        const company = await getUserDefaultCompany();
        
        if (!api || !company) {
          toast({
            title: "ERPNext Connection Error",
            description: "Please configure ERPNext settings in your profile",
            variant: "destructive"
          });
          return;
        }

        // Map pick list type to ERPNext purpose
        const purposeMap = {
          "Delivery": "Delivery",
          "Material Transfer": "Material Transfer",
          "Manufacturing": "Material Transfer for Manufacture"
        };

        // Map document type for ERPNext
        const documentTypeMap = {
          "Delivery": "Sales Order",
          "Material Transfer": "Material Request",
          "Manufacturing": "Work Order"
        };

        // Create pick list in ERPNext
        const pickListData = {
          purpose: purposeMap[selectedType],
          company: company,
          document_type: documentTypeMap[selectedType],
          document_name: selectedDocument.name
        };

        console.log('Creating pick list with data:', pickListData);

        // Create the pick list in ERPNext
        const result = await api.createPickListFromDocument(pickListData);
        
        console.log('Pick list created:', result);

        // Fetch the created pick list with items
        const createdPickList = await api.getPickList(result.data.name);
        const pickListItems = await api.getPickListItems(result.data.name);

        toast({
          title: "Pick List Created",
          description: `Pick List ${result.data.name} created successfully`,
          variant: "default"
        });

        // Pass the created pick list data to the parent component
        onComplete({
          name: result.data.name,
          type: selectedType,
          document: selectedDocument,
          items: pickListItems,
          erpnextData: createdPickList.data
        });

      } catch (error) {
        console.error('Error creating pick list:', error);
        toast({
          title: "Error Creating Pick List",
          description: "Failed to create pick list in ERPNext. Using fallback data.",
          variant: "destructive"
        });

        // Fallback to mock data
        const mockPickList = {
          name: `PICK-${Date.now().toString().slice(-5)}`,
          type: selectedType,
          document: selectedDocument,
          items: [
            {
              item_code: "ITEM-003",
              item_name: "Wooden Desk",
              qty: 3,
              uom: "Nos",
              warehouse: "Store A",
              batch_no: null,
              serial_no: null
            },
            {
              item_code: "ITEM-004",
              item_name: "Office Chair", 
              qty: 4,
              uom: "Nos",
              warehouse: "Store A",
              batch_no: null,
              serial_no: null
            }
          ]
        };

        onComplete(mockPickList);
      } finally {
        setIsCreatingPickList(false);
      }
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Select Pick List Type";
      case 2: return "Choose Document";
      case 3: return "Review & Create";
      default: return "";
    }
  };

  const progress = (currentStep / 3) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Create New Pick List</CardTitle>
            <Badge variant="outline">Step {currentStep} of 3</Badge>
          </div>
          <Progress value={progress} className="w-full" />
          
          {/* Step Indicators */}
          <div className="flex items-center justify-center space-x-4 mt-6">
            <div className={`flex items-center ${currentStep >= 1 ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 1 ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Select</span>
            </div>
            
            <ArrowRight className="w-4 h-4 text-gray-400" />
            
            <div className={`flex items-center ${currentStep >= 2 ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 2 ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Document</span>
            </div>
            
            <ArrowRight className="w-4 h-4 text-gray-400" />
            
            <div className={`flex items-center ${currentStep >= 3 ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 3 ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Create</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{getStepTitle()}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Step 1: Select Type */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pickListTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.type}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-lg ${
                      selectedType === type.type 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() => setSelectedType(type.type)}
                  >
                    <div className="text-center space-y-4">
                      <Icon className="w-12 h-12 mx-auto text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-lg">{type.title}</h3>
                        <p className="text-gray-600 text-sm mt-2">{type.description}</p>
                      </div>
                      {selectedType === type.type && (
                        <Badge className="bg-blue-100 text-blue-800">Selected</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Step 2: Select Document */}
          {currentStep === 2 && selectedType && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                Select a {selectedType.toLowerCase()} document to create pick list from:
              </p>
              
              {isLoadingDocuments ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading documents...</p>
                </div>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedDocument?.id === doc.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() => setSelectedDocument(doc)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <h4 className="font-medium">{doc.name}</h4>
                          {doc.customer && (
                            <p className="text-sm text-gray-600">Customer: {doc.customer}</p>
                          )}
                          <p className="text-xs text-gray-500">Date: {doc.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {doc.itemCount && (
                          <Badge variant="outline">{doc.itemCount} items</Badge>
                        )}
                        {selectedDocument?.id === doc.id && (
                          <div className="mt-1">
                            <Badge className="bg-blue-100 text-blue-800">Selected</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Step 3: Review & Create */}
          {currentStep === 3 && selectedType && selectedDocument && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">Ready to Create Pick List</h3>
                <p className="text-sm text-green-700">
                  Review the details below and click "Create Pick List" to create a draft pick list in ERPNext with items fetched according to the picking strategy.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Pick List Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{selectedType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Document:</span>
                      <span className="font-medium">{selectedDocument.name}</span>
                    </div>
                    {selectedDocument.customer && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Customer:</span>
                        <span className="font-medium">{selectedDocument.customer}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items to Pick:</span>
                      <span className="font-medium">{selectedDocument.itemCount || 'TBD'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">What happens next?</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• Draft pick list created in ERPNext</p>
                    <p>• Items fetched with warehouse locations</p>
                    <p>• Batch/serial information included</p>
                    <p>• Ready for item-by-item verification</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={isCreatingPickList}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="space-x-2">
          {currentStep < 3 ? (
            <Button 
              onClick={handleNext} 
              disabled={
                (currentStep === 1 && !selectedType) || 
                (currentStep === 2 && (!selectedDocument || isLoadingDocuments))
              }
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleCreatePickList} 
              size="lg" 
              className="px-8"
              disabled={isCreatingPickList}
            >
              {isCreatingPickList ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Pick List'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PickListCreationWizard;
