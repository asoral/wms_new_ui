
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, RefreshCcw } from "lucide-react";
import BinLabelForm from "../components/print-label/BinLabelForm";
import ItemLabelForm from "../components/print-label/ItemLabelForm";
import LabelPreview from "../components/print-label/LabelPreview";

export type LabelType = "bin" | "item";

export interface BinLabelData {
  warehouseId: string;
  warehouseName: string;
  barcode: string;
  items: Array<{
    itemCode: string;
    itemName: string;
    qty: number;
    uom: string;
    batch?: string;
    serial?: string;
  }>;
}

export interface ItemLabelData {
  itemCode: string;
  itemName: string;
  itemGroup: string;
  batchSerial?: string;
  qty: number;
  uom: string;
  itemBarcode: string;
  batchSerialBarcode?: string;
}

const PrintLabelPage = () => {
  const [activeTab, setActiveTab] = useState<LabelType>("bin");
  const [labelData, setLabelData] = useState<BinLabelData | ItemLabelData | null>(null);

  const handleGenerateLabel = (data: BinLabelData | ItemLabelData) => {
    setLabelData(data);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Printer className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Print Label</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon">
              <RefreshCcw className="w-4 h-4" />
            </Button>
            {labelData && (
              <Button onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print Label
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Label Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Label Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LabelType)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="bin">Bin Label</TabsTrigger>
                  <TabsTrigger value="item">Item Label</TabsTrigger>
                </TabsList>
                
                <TabsContent value="bin" className="mt-4">
                  <BinLabelForm onGenerateLabel={handleGenerateLabel} />
                </TabsContent>
                
                <TabsContent value="item" className="mt-4">
                  <ItemLabelForm onGenerateLabel={handleGenerateLabel} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Label Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Label Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {labelData ? (
                <LabelPreview 
                  labelData={labelData} 
                  labelType={activeTab} 
                />
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <Printer className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Configure label settings to see preview</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrintLabelPage;
