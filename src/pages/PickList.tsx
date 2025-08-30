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
        const plData = pickListDetails.data;
        
        // Convert to local format similar to createAndProcessPickList
        const formattedItems = Array.isArray(plData.locations) ? plData.locations.map((item: any, index: number) => ({
          id: (index + 1).toString(),
          item_code: item.item_code,
          code: item.item_code,
          item_name: item.item_name || item.item_code,
          name: item.item_name || item.item_code,
          warehouse: item.warehouse,
          bin: item.warehouse,
          batch_no: item.batch_no || '',
          batch: item.batch_no || '',
          serial_no: item.serial_no || '',
          serial: item.serial_no || '',
          qty: item.qty || 0,
          requiredQty: item.qty || 0,
          picked_qty: item.picked_qty || 0,
          pickedQty: item.picked_qty || 0,
          status: (item.picked_qty || 0) === 0 ? "pending" : 
                  (item.picked_qty || 0) < item.qty ? "partial" : "completed"
        })) : [];

        const formattedPickList: PickList = {
          name: plData.name,
          number: plData.name,
          purpose: plData.purpose as PickListPurpose,
          relatedDocument: plData.material_request || plData.work_order || 'N/A',
          status: plData.status || "Draft",
          company: plData.company || "Default Company",
          docstatus: plData.docstatus || 0,
          creation: plData.creation || new Date().toISOString(),
          createdDate: plData.creation || new Date().toISOString(),
          owner: plData.owner || "Administrator",
          items: formattedItems,
          locations: plData.locations // Keep original locations data
        };
        
        console.log('Formatted pick list with items:', formattedPickList);
        setSelectedPickList(formattedPickList);
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