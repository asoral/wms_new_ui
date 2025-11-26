import { useEffect } from "react";
import { BinLabelData, ItemLabelData, LabelType } from "../../pages/PrintLabel";
import JsBarcode from "jsbarcode";

interface LabelPreviewProps {
  labelData: BinLabelData | ItemLabelData;
  labelType: LabelType;
  copies?: number;
}

const LabelPreview = ({ labelData, labelType, copies = 1 }: LabelPreviewProps) => {
  useEffect(() => {
    // Generate barcodes for all SVG elements with class 'barcode-svg'
    const barcodeElements = document.querySelectorAll('.barcode-svg');
    const barcodeValue = labelType === "bin" 
      ? (labelData as BinLabelData).barcode 
      : (labelData as ItemLabelData).itemBarcode;
    
    barcodeElements.forEach((element) => {
      try {
        JsBarcode(element, barcodeValue, {
          format: "CODE128",
          width: 2,
          height: 60,
          displayValue: false,
          margin: 10,
        });
      } catch (error) {
        console.error("Failed to generate barcode:", error);
      }
    });
  }, [labelData, labelType, copies]);

  if (labelType === "bin") {
    const binData = labelData as BinLabelData;
    const warehouseList = binData.warehouses || [binData.warehouseId];
    
    // Generate labels for each copy
    const allLabels = [];
    for (let copyNum = 0; copyNum < copies; copyNum++) {
      for (let whIndex = 0; whIndex < warehouseList.length; whIndex++) {
        const warehouse = warehouseList[whIndex];
        allLabels.push(
          <div 
            key={`${copyNum}-${whIndex}`}
            className="print-label bg-white border-2 border-dashed border-gray-300 p-6 w-full max-w-md mx-auto mb-4"
          >
            <div className="text-center space-y-4">
              {/* Barcode */}
              <div className="flex justify-center">
                <svg className="barcode-svg"></svg>
              </div>
              
              {/* Warehouse Name */}
              <div className="space-y-1">
                <div className="font-bold text-xl">{warehouse}</div>
              </div>
            </div>
          </div>
        );
      }
    }
    
    return <div className="space-y-4">{allLabels}</div>;
  } else {
    const itemData = labelData as ItemLabelData;
    
    // Generate labels for each copy
    const allLabels = [];
    for (let copyNum = 0; copyNum < copies; copyNum++) {
      allLabels.push(
        <div 
          key={copyNum}
          className="print-label bg-white border-2 border-dashed border-gray-300 p-6 w-full max-w-md mx-auto mb-4"
        >
          {/* Item Label */}
          <div className="text-center space-y-4">
            {/* Barcode */}
            <div className="flex justify-center">
              <svg className="barcode-svg"></svg>
            </div>
            
            {/* Item Info */}
            <div className="space-y-2">
              <div className="font-bold text-lg">{itemData.itemName}</div>
              <div className="text-sm text-gray-600">{itemData.itemCode}</div>
              <div className="text-sm">{itemData.itemGroup}</div>
            </div>
            
            {/* Quantity */}
            <div className="text-base font-medium">
              {itemData.qty} {itemData.uom}
            </div>
            
            {/* Batch/Serial */}
            {itemData.batchSerial && (
              <div className="space-y-1">
                <div className="text-sm font-medium">Batch/Serial: {itemData.batchSerial}</div>
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
    
    return <div className="space-y-4">{allLabels}</div>;
  }
};

export default LabelPreview;
