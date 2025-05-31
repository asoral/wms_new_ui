
import { Card, CardContent } from "@/components/ui/card";
import { BinLabelData, ItemLabelData, LabelType } from "../../pages/PrintLabel";

interface LabelPreviewProps {
  labelData: BinLabelData | ItemLabelData;
  labelType: LabelType;
}

const LabelPreview = ({ labelData, labelType }: LabelPreviewProps) => {
  if (labelType === "bin") {
    const binData = labelData as BinLabelData;
    return (
      <div className="print-label bg-white border-2 border-dashed border-gray-300 p-4 w-full max-w-sm mx-auto">
        {/* Bin Label */}
        <div className="text-center space-y-2">
          <div className="text-xs font-bold">BIN LABEL</div>
          
          {/* Warehouse Barcode */}
          <div className="bg-black text-white font-mono text-xs p-2 rounded">
            |||||| {binData.barcode} ||||||
          </div>
          
          {/* Warehouse Info */}
          <div className="space-y-1">
            <div className="font-bold text-sm">{binData.warehouseName}</div>
            <div className="text-xs text-gray-600">{binData.warehouseId}</div>
          </div>
          
          {/* Items Summary (for information, not printed) */}
          <div className="mt-4 text-xs border-t pt-2">
            <div className="font-medium mb-1">Items in Bin:</div>
            <div className="text-left space-y-1 max-h-20 overflow-y-auto">
              {binData.items.slice(0, 3).map((item, index) => (
                <div key={index} className="text-xs">
                  {item.itemCode} - {item.qty} {item.uom}
                </div>
              ))}
              {binData.items.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{binData.items.length - 3} more items
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    const itemData = labelData as ItemLabelData;
    return (
      <div className="print-label bg-white border-2 border-dashed border-gray-300 p-4 w-full max-w-sm mx-auto">
        {/* Item Label */}
        <div className="text-center space-y-2">
          <div className="text-xs font-bold">ITEM LABEL</div>
          
          {/* Item Barcode */}
          <div className="bg-black text-white font-mono text-xs p-2 rounded">
            |||||| {itemData.itemBarcode} ||||||
          </div>
          
          {/* Item Info */}
          <div className="space-y-1">
            <div className="font-bold text-sm">{itemData.itemName}</div>
            <div className="text-xs text-gray-600">{itemData.itemCode}</div>
            <div className="text-xs">{itemData.itemGroup}</div>
          </div>
          
          {/* Quantity */}
          <div className="text-sm font-medium">
            {itemData.qty} {itemData.uom}
          </div>
          
          {/* Batch/Serial */}
          {itemData.batchSerial && (
            <div className="space-y-1">
              <div className="text-xs font-medium">Batch/Serial: {itemData.batchSerial}</div>
              {itemData.batchSerialBarcode && (
                <div className="bg-black text-white font-mono text-xs p-1 rounded">
                  |||| {itemData.batchSerialBarcode} ||||
                </div>
              )}
            </div>
          )}
          
          {/* Date */}
          <div className="text-xs text-gray-500 mt-2">
            {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    );
  }
};

export default LabelPreview;
