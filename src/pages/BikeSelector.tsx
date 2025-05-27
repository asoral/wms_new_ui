
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft } from "lucide-react";

const bikeBrands = ["Honda", "Yamaha", "Royal Enfield", "KTM", "Bajaj", "TVS"];
const bikeModels: Record<string, string[]> = {
  "Honda": ["CB350", "CB300R", "CBR250R", "Hornet"],
  "Yamaha": ["FZ25", "R15", "MT15", "Fascino"],
  "Royal Enfield": ["Classic 350", "Bullet 350", "Himalayan", "Interceptor 650"],
  "KTM": ["Duke 200", "Duke 390", "RC 200", "Adventure 390"],
  "Bajaj": ["Pulsar NS200", "Dominar 400", "Avenger 220", "Platina"],
  "TVS": ["Apache RTR 160", "Ntorq 125", "Jupiter", "Raider 125"]
};

const BikeSelector = () => {
  const navigate = useNavigate();
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const handleContinue = () => {
    if (selectedBrand && selectedModel && selectedYear) {
      const newBike = {
        id: Date.now(),
        brand: selectedBrand,
        model: selectedModel,
        year: parseInt(selectedYear),
        image: "/placeholder.svg"
      };
      navigate("/customize/new", { state: { bike: newBike } });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b p-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold">Select Your Bike</h1>
      </div>

      <div className="p-4 space-y-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Bike Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Brand</label>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {bikeBrands.map((brand) => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Model</label>
              <Select 
                value={selectedModel} 
                onValueChange={setSelectedModel}
                disabled={!selectedBrand}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {selectedBrand && bikeModels[selectedBrand]?.map((model) => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            className="w-full mt-6" 
            onClick={handleContinue}
            disabled={!selectedBrand || !selectedModel || !selectedYear}
          >
            Continue to Customization
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BikeSelector;
