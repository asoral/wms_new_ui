import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { createERPNextAPI } from "@/services/erpnextApi";
import PickListDashboard from "@/components/picking/PickListDashboard";
import PickListCreation from "@/components/picking/PickListCreation";
import PickingProcess from "@/components/picking/PickingProcess";

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

type ViewState = 'dashboard' | 'creation' | 'picking';

const PickListPage = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [selectedPickList, setSelectedPickList] = useState<PickList | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateNew = () => {
    setCurrentView('creation');
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
        setCurrentView('picking');
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

  const handlePickListCreated = (pickListData: any) => {
    // Convert created pick list to our format and start picking
    const formattedPickList: PickList = {
      name: pickListData.name,
      number: pickListData.name,
      purpose: pickListData.purpose as PickListPurpose,
      relatedDocument: pickListData.relatedDocument || 'N/A',
      status: "Draft",
      company: pickListData.company,
      docstatus: 0,
      creation: new Date().toISOString(),
      createdDate: new Date().toISOString(),
      owner: "Administrator",
      items: pickListData.items || [],
      locations: pickListData.locations
    };
    
    setSelectedPickList(formattedPickList);
    setCurrentView('picking');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedPickList(null);
  };

  const handlePickingComplete = () => {
    toast({
      title: "Pick List Completed",
      description: "Pick list has been successfully completed.",
    });
    setCurrentView('dashboard');
    setSelectedPickList(null);
  };

  if (currentView === 'dashboard') {
    return (
      <PickListDashboard
        onCreateNew={handleCreateNew}
        onSelectPickList={handleSelectPickList}
      />
    );
  }

  if (currentView === 'creation') {
    return (
      <PickListCreation
        onPickListCreated={handlePickListCreated}
        onBack={handleBackToDashboard}
      />
    );
  }

  if (currentView === 'picking' && selectedPickList) {
    return (
      <PickingProcess
        pickList={selectedPickList}
        onBack={handleBackToDashboard}
        onComplete={handlePickingComplete}
      />
    );
  }

  return null;
};

export default PickListPage;