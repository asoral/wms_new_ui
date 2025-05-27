
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, RotateCcw, Share, Heart } from "lucide-react";

const bikeStyles = [
  { id: "cafe-racer", name: "Cafe Racer", image: "/placeholder.svg" },
  { id: "scrambler", name: "Scrambler", image: "/placeholder.svg" },
  { id: "cruiser", name: "Cruiser", image: "/placeholder.svg" },
  { id: "sport", name: "Sport", image: "/placeholder.svg" }
];

const bikeParts = [
  { id: "tank", name: "Tank", options: ["Standard", "Cafe Style", "Bobber Style"] },
  { id: "seat", name: "Seat", options: ["Standard", "Single Seat", "Bench Seat"] },
  { id: "exhaust", name: "Exhaust", options: ["Stock", "Free Flow", "Performance"] },
  { id: "lights", name: "Lights", options: ["Halogen", "LED", "Projector"] },
  { id: "tires", name: "Tires", options: ["Street", "Off-road", "Sport"] },
  { id: "shockers", name: "Shockers", options: ["Standard", "Adjustable", "Air Suspension"] }
];

const CustomizeBike = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bike = location.state?.bike;
  const [selectedStyle, setSelectedStyle] = useState("");
  const [selectedParts, setSelectedParts] = useState<Record<string, string>>({});

  if (!bike) {
    navigate("/my-bikes");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">{bike.brand} {bike.model}</h1>
            <p className="text-sm text-gray-600">Mod Shop</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Share className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 3D Bike View Area */}
      <div className="h-64 bg-gradient-to-b from-gray-100 to-gray-200 flex items-center justify-center border-b">
        <div className="text-center">
          <div className="w-48 h-32 bg-gray-300 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-gray-600">3D Bike View</span>
          </div>
          <p className="text-sm text-gray-600">Rotate and zoom to view your bike</p>
        </div>
      </div>

      <Tabs defaultValue="styles" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
          <TabsTrigger value="styles">Quick Styles</TabsTrigger>
          <TabsTrigger value="parts">Individual Parts</TabsTrigger>
        </TabsList>

        <TabsContent value="styles" className="p-4 space-y-4">
          <h3 className="text-lg font-semibold">Choose a Style</h3>
          <div className="grid grid-cols-2 gap-3">
            {bikeStyles.map((style) => (
              <div 
                key={style.id}
                className={`bg-white rounded-lg p-3 border-2 cursor-pointer transition-colors ${
                  selectedStyle === style.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                }`}
                onClick={() => setSelectedStyle(style.id)}
              >
                <div className="w-full h-24 bg-gray-200 rounded mb-2">
                  <img src={style.image} alt={style.name} className="w-full h-full object-cover rounded" />
                </div>
                <p className="text-sm font-medium text-center">{style.name}</p>
              </div>
            ))}
          </div>
          {selectedStyle && (
            <Button className="w-full">
              Apply {bikeStyles.find(s => s.id === selectedStyle)?.name} Style
            </Button>
          )}
        </TabsContent>

        <TabsContent value="parts" className="p-4 space-y-4">
          <h3 className="text-lg font-semibold">Customize Parts</h3>
          {bikeParts.map((part) => (
            <div key={part.id} className="bg-white rounded-lg p-4">
              <h4 className="font-medium mb-3">{part.name}</h4>
              <div className="grid grid-cols-1 gap-2">
                {part.options.map((option) => (
                  <Button
                    key={option}
                    variant={selectedParts[part.id] === option ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setSelectedParts(prev => ({ ...prev, [part.id]: option }))}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t p-4 flex gap-3">
        <Button variant="outline" className="flex-1">
          Save Build
        </Button>
        <Button className="flex-1">
          Share Build
        </Button>
      </div>
    </div>
  );
};

export default CustomizeBike;
