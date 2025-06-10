
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Camera, Loader2 } from "lucide-react";
import CameraScanner from "../item-enquiry/CameraScanner";

interface SearchCardProps {
  title: string;
  placeholder: string;
  onSearch: (query: string) => void;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const SearchCard = ({ title, placeholder, onSearch, isLoading = false, icon }: SearchCardProps) => {
  const [activeTab, setActiveTab] = useState("manual");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCamera, setShowCamera] = useState(false);

  const handleManualSearch = () => {
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSearch();
    }
  };

  const handleBarcodeDetected = (code: string) => {
    console.log('Barcode detected in SearchCard:', code);
    setShowCamera(false);
    setActiveTab("manual");
    onSearch(code);
  };

  const startScanning = () => {
    setShowCamera(true);
  };

  const stopScanning = () => {
    setShowCamera(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          {icon}
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="flex items-center space-x-2">
              <Search className="w-4 h-4" />
              <span>Manual Entry</span>
            </TabsTrigger>
            <TabsTrigger value="scan" className="flex items-center space-x-2">
              <Camera className="w-4 h-4" />
              <span>Scan Barcode</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="mt-4 space-y-4">
            <div className="flex space-x-2">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                onClick={handleManualSearch}
                disabled={!searchTerm.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="scan" className="mt-4">
            {!showCamera ? (
              <div className="text-center space-y-4">
                <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Camera className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Scan Barcode
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Use your camera to scan a barcode
                  </p>
                  <Button 
                    onClick={startScanning}
                    disabled={isLoading}
                    className="flex items-center space-x-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Start Camera</span>
                  </Button>
                </div>
              </div>
            ) : (
              <CameraScanner
                onBarcodeScanned={handleBarcodeDetected}
                onClose={stopScanning}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SearchCard;
