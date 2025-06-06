
import WarehouseSelector from "./WarehouseSelector";

interface BinScannerProps {
  onBinScanned: (binCode: string) => void;
  isLoading: boolean;
}

const BinScanner = ({ onBinScanned, isLoading }: BinScannerProps) => {
  const handleWarehouseSelected = (warehouseCode: string) => {
    onBinScanned(warehouseCode);
  };

  return (
    <div className="w-full">
      <WarehouseSelector 
        onWarehouseSelected={handleWarehouseSelected}
        isLoading={isLoading}
      />
    </div>
  );
};

export default BinScanner;
