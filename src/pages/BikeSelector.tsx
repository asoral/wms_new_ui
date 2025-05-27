
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Search, Star } from "lucide-react";

const bikeBrands = ["Honda", "Yamaha", "Royal Enfield", "KTM", "Bajaj", "TVS"];
const bikeModels: Record<string, { name: string; rating: number; image: string }[]> = {
  "Honda": [
    { name: "CB350", rating: 4.8, image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=200&h=120&fit=crop" },
    { name: "CB300R", rating: 4.6, image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=200&h=120&fit=crop" },
    { name: "CBR250R", rating: 4.7, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=120&fit=crop" },
    { name: "Hornet", rating: 4.5, image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=200&h=120&fit=crop" }
  ],
  "Yamaha": [
    { name: "FZ25", rating: 4.6, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=120&fit=crop" },
    { name: "R15", rating: 4.9, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=120&fit=crop" },
    { name: "MT15", rating: 4.7, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=120&fit=crop" },
    { name: "Fascino", rating: 4.4, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=120&fit=crop" }
  ],
  "Royal Enfield": [
    { name: "Classic 350", rating: 4.5, image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=200&h=120&fit=crop" },
    { name: "Bullet 350", rating: 4.3, image: "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=200&h=120&fit=crop" },
    { name: "Himalayan", rating: 4.6, image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=200&h=120&fit=crop" },
    { name: "Interceptor 650", rating: 4.8, image: "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=200&h=120&fit=crop" }
  ],
  "KTM": [
    { name: "Duke 200", rating: 4.7, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=120&fit=crop" },
    { name: "Duke 390", rating: 4.8, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=120&fit=crop" },
    { name: "RC 200", rating: 4.6, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=120&fit=crop" },
    { name: "Adventure 390", rating: 4.7, image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=200&h=120&fit=crop" }
  ],
  "Bajaj": [
    { name: "Pulsar NS200", rating: 4.5, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=120&fit=crop" },
    { name: "Dominar 400", rating: 4.6, image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=200&h=120&fit=crop" },
    { name: "Avenger 220", rating: 4.4, image: "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=200&h=120&fit=crop" },
    { name: "Platina", rating: 4.2, image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=200&h=120&fit=crop" }
  ],
  "TVS": [
    { name: "Apache RTR 160", rating: 4.5, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=120&fit=crop" },
    { name: "Ntorq 125", rating: 4.3, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=120&fit=crop" },
    { name: "Jupiter", rating: 4.4, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=120&fit=crop" },
    { name: "Raider 125", rating: 4.6, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=120&fit=crop" }
  ]
};

const BikeSelector = () => {
  const navigate = useNavigate();
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const handleContinue = () => {
    if (selectedBrand && selectedModel && selectedYear) {
      const modelData = bikeModels[selectedBrand]?.find(m => m.name === selectedModel);
      const newBike = {
        id: Date.now(),
        brand: selectedBrand,
        model: selectedModel,
        year: parseInt(selectedYear),
        image: modelData?.image || "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=200&fit=crop"
      };
      navigate("/customize/new", { state: { bike: newBike } });
    }
  };

  const filteredBrands = bikeBrands.filter(brand => 
    brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableModels = selectedBrand ? bikeModels[selectedBrand] || [] : [];
  const filteredModels = availableModels.filter(model =>
    model.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
      {/* Header */}
      <div className="glass-effect border-b-0 sticky top-0 z-10">
        <div className="gradient-bg p-4 text-white flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-white hover:bg-white/20">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Select Your Bike</h1>
            <p className="text-white/80 text-sm">Choose your motorcycle model</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Selection Form */}
          <div className="bike-card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Bike Details</h2>
            
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search brands or models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Brand</label>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger className="h-12 border-gray-300 rounded-xl">
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBrands.map((brand) => (
                      <SelectItem key={brand} value={brand} className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {brand[0]}
                          </div>
                          {brand}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Model</label>
                <Select 
                  value={selectedModel} 
                  onValueChange={setSelectedModel}
                  disabled={!selectedBrand}
                >
                  <SelectTrigger className="h-12 border-gray-300 rounded-xl">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredModels.map((model) => (
                      <SelectItem key={model.name} value={model.name} className="py-3">
                        <div className="flex items-center gap-3">
                          <img src={model.image} alt={model.name} className="w-8 h-6 object-cover rounded" />
                          <div>
                            <div className="font-medium">{model.name}</div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Star className="w-3 h-3 fill-current text-yellow-400" />
                              {model.rating}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Year</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="h-12 border-gray-300 rounded-xl">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()} className="py-3">
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              className="w-full mt-8 h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl" 
              onClick={handleContinue}
              disabled={!selectedBrand || !selectedModel || !selectedYear}
            >
              Continue to Customization
            </Button>
          </div>

          {/* Preview Card */}
          <div className="bike-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
            
            {selectedBrand && selectedModel ? (
              <div className="space-y-4">
                <div className="relative h-48 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl overflow-hidden">
                  <img 
                    src={bikeModels[selectedBrand]?.find(m => m.name === selectedModel)?.image || "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=240&fit=crop"}
                    alt={`${selectedBrand} ${selectedModel}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-gray-900">
                    {selectedBrand} {selectedModel}
                  </h4>
                  {selectedYear && (
                    <p className="text-gray-600">Year: {selectedYear}</p>
                  )}
                  
                  {selectedBrand && selectedModel && (
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 fill-current text-yellow-400" />
                      <span className="font-medium">
                        {bikeModels[selectedBrand]?.find(m => m.name === selectedModel)?.rating || 4.5}
                      </span>
                      <span className="text-gray-500 text-sm">Community Rating</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 bg-gray-100 rounded-xl">
                <div className="text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <Search className="w-8 h-8" />
                  </div>
                  <p>Select a bike to see preview</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Popular Models */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Popular Models</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(bikeModels).slice(0, 3).flatMap(([brand, models]) =>
              models.slice(0, 2).map((model) => (
                <div 
                  key={`${brand}-${model.name}`}
                  className="bike-card p-3 cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => {
                    setSelectedBrand(brand);
                    setSelectedModel(model.name);
                  }}
                >
                  <img src={model.image} alt={model.name} className="w-full h-20 object-cover rounded-lg mb-2" />
                  <p className="font-medium text-sm text-gray-900">{brand}</p>
                  <p className="text-xs text-gray-600">{model.name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-current text-yellow-400" />
                    <span className="text-xs text-gray-500">{model.rating}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BikeSelector;
