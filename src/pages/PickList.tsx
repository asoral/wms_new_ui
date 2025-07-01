
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { createERPNextAPI } from "@/services/erpnextApi";
import PickListDashboard from "@/components/picking/PickListDashboard";
import PickListItemProcessor from "@/components/picking/PickListItemProcessor";

// Export the types that other components need
export interface PickList {
  name: string;
  purpose: string;
  company: string;
  docstatus: number;
  creation: string;
  owner: string;
  locations?: PickListItem[];
}

export interface PickListItem {
  item_code: string;
  item_name: string;
  qty: number;
  picked_qty?: number;
  warehouse: string;
  batch_no?: string;
  serial_no?: string;
}

export type PickListPurpose = 'Delivery' | 'Material Transfer' | 'Material Issue' | 'Manufacturing';
export type PickListStatus = 'Draft' | 'Open' | 'Completed';

const PickListPage = () => {
  const [showDashboard, setShowDashboard] = useState(true);
  const [selectedPickList, setSelectedPickList] = useState<any>(null);
  const [processedItems, setProcessedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateNew = () => {
    alert('Create New Pick List');
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
        setShowDashboard(false);
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

  const handleItemsProcessed = (items: any[]) => {
    setProcessedItems(items);
    console.log('Processed items:', items);
    alert('Items Processed');
  };

  const handleBackToDashboard = () => {
    setShowDashboard(true);
    setSelectedPickList(null);
    setProcessedItems([]);
  };

  if (showDashboard) {
    return (
      <PickListDashboard
        onCreateNew={handleCreateNew}
        onSelectPickList={handleSelectPickList}
      />
    );
  }

  return (
    <div>
      {selectedPickList && (
        <PickListItemProcessor
          pickListNumber={selectedPickList.name}
          pickListItems={selectedPickList.locations}
          onItemsProcessed={handleItemsProcessed}
          onBack={handleBackToDashboard}
        />
      )}
    </div>
  );
};

export default PickListPage;
