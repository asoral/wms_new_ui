
import SalesOrderSelector from "@/components/deliver/SalesOrderSelector";
import { SalesOrder } from "@/types";

interface SalesOrderSearchProps {
  onSelectSO: (salesOrder: SalesOrder) => void;
  shortcuts?: Array<{
    label: string;
    icon: any;
    action: () => void;
  }>;
}

const SalesOrderSearch = ({ onSelectSO, shortcuts = [] }: SalesOrderSearchProps) => {
  return (
    <SalesOrderSelector 
      onSelectSO={onSelectSO}
      shortcuts={shortcuts}
    />
  );
};

export default SalesOrderSearch;
