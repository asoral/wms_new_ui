import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { createERPNextAPI } from "@/services/erpnextApi";
import PickListDashboard from "@/components/picking/PickListDashboard";
import PickListDetails from "@/components/picking/PickListDetails";
import PickingProcess from "@/components/picking/PickingProcess";
import PickListReviewSubmit from "@/components/picking/PickListReviewSubmit";

// Export the types that other components need
export interface PickList {
  name: string;
  purpose: PickListPurpose;
  company: string;
  docstatus: number;
  creation: string;
  owner: string;
  locations?: PickListItem[];
  // Additional properties used by components
  id?: string;
  number?: string;
  status?: PickListStatus;
  createdDate?: string;
  relatedDocument?: string;
  items?: PickListItem[];
}

export interface PickListItem {
  item_code: string;
  item_name: string;
  qty: number;
  picked_qty?: number;
  warehouse: string;
  batch_no?: string;
  serial_no?: string;
  has_batch_no?: boolean;
  has_serial_no?: boolean;
  // Additional properties used by components
  id?: string;
  code?: string;
  name?: string;
  requiredQty?: number;
  pickedQty?: number;
  bin?: string;
  batch?: string;
  serial?: string;
  status?: string;
  scanned_serials?: string[];
  scanned_batch?: string;
}

export type PickListPurpose = 'Delivery' | 'Material Transfer' | 'Material Transfer for Manufacture' | 'Manufacturing';
export type PickListStatus = 'Draft' | 'Open' | 'Completed';

type ViewState = 'dashboard' | 'details' | 'picking' | 'review';

const PickListPage = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [selectedPickList, setSelectedPickList] = useState<PickList | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pickedItems, setPickedItems] = useState<PickListItem[]>([]);
  const { toast } = useToast();

  const handleCreateNew = () => {
    setIsCreatingNew(true);
    setSelectedPickList(null);
    setCurrentView('details');
  };

  const handleSelectPickList = async (pickList: any) => {
    try {
      setLoading(true);
      const erpnextAPI = await createERPNextAPI();
      if (!erpnextAPI) return;

      // Get full pick list details
      const pickListDetails = await erpnextAPI.getPickList(pickList.name);
      
      if (pickListDetails.data) {
        setSelectedPickList(pickListDetails.data);
        setIsCreatingNew(false);
        setCurrentView('details');
      }
    } catch (error) {
      console.error('Error loading pick list:', error);
      toast({
        title: "Error",
        description: "Failed to load pick list details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartPicking = (pickList: PickList) => {
    setSelectedPickList(pickList);
    setCurrentView('picking');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedPickList(null);
    setIsCreatingNew(false);
  };

  const handleBackToDetails = () => {
    setCurrentView('details');
  };

  const handlePickingComplete = (items: PickListItem[]) => {
    console.log('Picking completed with items:', items);
    setPickedItems(items);
    setCurrentView('review');
  };

  const handleEditItem = (index: number) => {
    // Go back to picking at specific item
    setCurrentView('picking');
  };

  const handleFinalSubmit = () => {
    toast({
      title: "Pick List Submitted",
      description: "Pick list has been successfully submitted.",
    });
    setCurrentView('dashboard');
    setSelectedPickList(null);
    setIsCreatingNew(false);
    setPickedItems([]);
  };

  if (currentView === 'dashboard') {
    return (
      <PickListDashboard
        onCreateNew={handleCreateNew}
        onSelectPickList={handleSelectPickList}
      />
    );
  }

  if (currentView === 'details') {
    return (
      <PickListDetails
        pickList={selectedPickList}
        isCreatingNew={isCreatingNew}
        onStartPicking={handleStartPicking}
        onBack={handleBackToDashboard}
      />
    );
  }

  if (currentView === 'picking' && selectedPickList) {
    return (
      <PickingProcess
        pickList={selectedPickList}
        onBack={handleBackToDetails}
        onComplete={handlePickingComplete}
      />
    );
  }

  if (currentView === 'review' && selectedPickList) {
    return (
      <PickListReviewSubmit
        pickList={selectedPickList}
        items={pickedItems}
        onBack={() => setCurrentView('picking')}
        onEditItem={handleEditItem}
        onSubmit={handleFinalSubmit}
      />
    );
  }

  return null;
};

export default PickListPage;