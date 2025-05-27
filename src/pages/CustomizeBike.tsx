
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, RotateCcw, Share, Heart, Palette, Wrench, Settings } from "lucide-react";

const bikeStyles = [
  { 
    id: "cafe-racer", 
    name: "Cafe Racer", 
    image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=200&h=120&fit=crop",
    description: "Classic retro styling with low handlebars"
  },
  { 
    id: "scrambler", 
    name: "Scrambler", 
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=200&h=120&fit=crop",
    description: "Off-road ready with rugged styling"
  },
  { 
    id: "cruiser", 
    name: "Cruiser", 
    image: "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=200&h=120&fit=crop",
    description: "Comfortable touring with relaxed position"
  },
  { 
    id: "sport", 
    name: "Sport", 
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=120&fit=crop",
    description: "Aggressive aerodynamic design"
  }
];

const bikeParts = [
  { 
    id: "tank", 
    name: "Fuel Tank", 
    icon: "🛢️",
    options: [
      { name: "Standard", price: "$0", image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=100&h=60&fit=crop" },
      { name: "Cafe Style", price: "$299", image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=100&h=60&fit=crop" },
      { name: "Bobber Style", price: "$399", image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=100&h=60&fit=crop" }
    ]
  },
  { 
    id: "seat", 
    name: "Seat", 
    icon: "🪑",
    options: [
      { name: "Standard", price: "$0", image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=100&h=60&fit=crop" },
      { name: "Single Seat", price: "$199", image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=100&h=60&fit=crop" },
      { name: "Bench Seat", price: "$249", image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=100&h=60&fit=crop" }
    ]
  },
  { 
    id: "exhaust", 
    name: "Exhaust", 
    icon: "💨",
    options: [
      { name: "Stock", price: "$0", image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=100&h=60&fit=crop" },
      { name: "Free Flow", price: "$399", image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=100&h=60&fit=crop" },
      { name: "Performance", price: "$599", image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=100&h=60&fit=crop" }
    ]
  },
  { 
    id: "lights", 
    name: "Headlights", 
    icon: "💡",
    options: [
      { name: "Halogen", price: "$0", image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=100&h=60&fit=crop" },
      { name: "LED", price: "$199", image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=100&h=60&fit=crop" },
      { name: "Projector", price: "$299", image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=100&h=60&fit=crop" }
    ]
  },
  { 
    id: "tires", 
    name: "Tires", 
    icon: "⭕",
    options: [
      { name: "Street", price: "$0", image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=100&h=60&fit=crop" },
      { name: "Off-road", price: "$299", image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=100&h=60&fit=crop" },
      { name: "Sport", price: "$399", image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=100&h=60&fit=crop" }
    ]
  },
  { 
    id: "shockers", 
    name: "Suspension", 
    icon: "🔧",
    options: [
      { name: "Standard", price: "$0", image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=100&h=60&fit=crop" },
      { name: "Adjustable", price: "$499", image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=100&h=60&fit=crop" },
      { name: "Air Suspension", price: "$799", image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=100&h=60&fit=crop" }
    ]
  }
];

const CustomizeBike = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bike = location.state?.bike;
  const [selectedStyle, setSelectedStyle] = useState("");
  const [selectedParts, setSelectedParts] = useState<Record<string, string>>({});
  const [rotation, setRotation] = useState(0);

  if (!bike) {
    navigate("/my-bikes");
    return null;
  }

  const getTotalPrice = () => {
    let total = 0;
    Object.entries(selectedParts).forEach(([partId, optionName]) => {
      const part = bikeParts.find(p => p.id === partId);
      const option = part?.options.find(o => o.name === optionName);
      if (option && option.price !== "$0") {
        total += parseInt(option.price.replace(/[^0-9]/g, ''));
      }
    });
    return total;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
      {/* Header */}
      <div className="glass-effect border-b-0 sticky top-0 z-10">
        <div className="gradient-bg p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-white hover:bg-white/20">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{bike.brand} {bike.model}</h1>
              <p className="text-white/80 text-sm">Virtual Mod Shop</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <Share className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
          {/* 3D Bike View Area */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bike-card p-6">
              <div className="relative h-96 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden">
                {/* 3D Bike Representation */}
                <div 
                  className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
                  style={{ transform: `rotateY(${rotation}deg)` }}
                  onMouseDown={(e) => {
                    const startX = e.clientX;
                    const startRotation = rotation;
                    
                    const handleMouseMove = (e: MouseEvent) => {
                      const deltaX = e.clientX - startX;
                      setRotation(startRotation + deltaX * 0.5);
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  <div className="relative">
                    <img 
                      src={bike.image} 
                      alt="3D Bike"
                      className="w-80 h-60 object-contain filter drop-shadow-2xl"
                    />
                    
                    {/* Interactive hotspots */}
                    <div className="absolute top-8 left-16 w-3 h-3 bg-blue-500 rounded-full animate-pulse cursor-pointer" title="Headlight" />
                    <div className="absolute top-12 left-32 w-3 h-3 bg-red-500 rounded-full animate-pulse cursor-pointer" title="Fuel Tank" />
                    <div className="absolute top-20 left-40 w-3 h-3 bg-green-500 rounded-full animate-pulse cursor-pointer" title="Seat" />
                    <div className="absolute bottom-16 right-20 w-3 h-3 bg-purple-500 rounded-full animate-pulse cursor-pointer" title="Exhaust" />
                  </div>
                </div>

                {/* Controls overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                  <div className="glass-effect rounded-lg px-3 py-2">
                    <p className="text-white text-sm font-medium">Drag to rotate • Click hotspots</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Current Build Summary */}
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-2">Current Build</h3>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Modifications:</span>
                  <span className="font-bold text-lg text-blue-600">${getTotalPrice()}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-600">Parts Changed:</span>
                  <span className="font-medium text-gray-900">{Object.keys(selectedParts).length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customization Panel */}
          <div className="space-y-4">
            <Tabs defaultValue="styles" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm">
                <TabsTrigger value="styles" className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Quick Styles
                </TabsTrigger>
                <TabsTrigger value="parts" className="flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  Parts
                </TabsTrigger>
                <TabsTrigger value="colors" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Colors
                </TabsTrigger>
              </TabsList>

              <TabsContent value="styles" className="space-y-4">
                <div className="bike-card p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Choose a Style</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bikeStyles.map((style) => (
                      <div 
                        key={style.id}
                        className={`group cursor-pointer rounded-xl p-4 border-2 transition-all duration-300 ${
                          selectedStyle === style.id 
                            ? "border-blue-500 bg-blue-50 shadow-lg" 
                            : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                        }`}
                        onClick={() => setSelectedStyle(style.id)}
                      >
                        <div className="relative overflow-hidden rounded-lg mb-3">
                          <img 
                            src={style.image} 
                            alt={style.name} 
                            className="w-full h-24 object-cover group-hover:scale-110 transition-transform duration-300" 
                          />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">{style.name}</h4>
                        <p className="text-sm text-gray-600">{style.description}</p>
                      </div>
                    ))}
                  </div>
                  {selectedStyle && (
                    <Button className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                      Apply {bikeStyles.find(s => s.id === selectedStyle)?.name} Style
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="parts" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bikeParts.map((part) => (
                    <div key={part.id} className="bike-card p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{part.icon}</span>
                        <h4 className="font-semibold text-gray-900">{part.name}</h4>
                      </div>
                      <div className="space-y-2">
                        {part.options.map((option) => (
                          <div
                            key={option.name}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                              selectedParts[part.id] === option.name
                                ? "bg-blue-100 border border-blue-300"
                                : "bg-gray-50 hover:bg-gray-100 border border-transparent"
                            }`}
                            onClick={() => setSelectedParts(prev => ({ ...prev, [part.id]: option.name }))}
                          >
                            <img src={option.image} alt={option.name} className="w-12 h-8 object-cover rounded" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{option.name}</p>
                              <p className="text-xs text-gray-600">{option.price}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="colors" className="space-y-4">
                <div className="bike-card p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Color Schemes</h3>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                    {['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'].map((color, index) => (
                      <div 
                        key={index}
                        className="w-16 h-16 rounded-full cursor-pointer border-4 border-white shadow-lg hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-16 left-0 right-0 glass-effect border-t p-4 z-20">
        <div className="max-w-7xl mx-auto flex gap-3">
          <Button variant="outline" className="flex-1 border-gray-300 hover:bg-gray-50">
            <Heart className="w-4 h-4 mr-2" />
            Save Build
          </Button>
          <Button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
            <Share className="w-4 h-4 mr-2" />
            Share Build (${getTotalPrice()})
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomizeBike;
