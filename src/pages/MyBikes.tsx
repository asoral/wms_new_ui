import { useState } from "react";
import { Plus, Edit, ChevronRight, Star, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Bike {
  id: number;
  brand: string;
  model: string;
  year: number;
  image: string;
  rating?: number;
  lastModified?: string;
}

const MyBikes = () => {
  const navigate = useNavigate();
  const [bikes, setBikes] = useState<Bike[]>([
    {
      id: 1,
      brand: "Honda",
      model: "CB350",
      year: 2022,
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=200&fit=crop",
      rating: 4.8,
      lastModified: "2 days ago"
    },
    {
      id: 2,
      brand: "Royal Enfield",
      model: "Classic 350",
      year: 2021,
      image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=300&h=200&fit=crop",
      rating: 4.6,
      lastModified: "1 week ago"
    },
    {
      id: 3,
      brand: "Yamaha",
      model: "R15",
      year: 2023,
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop",
      rating: 4.9,
      lastModified: "3 days ago"
    }
  ]);

  const handleSelectBike = (bike: Bike) => {
    navigate(`/customize/${bike.id}`, { state: { bike } });
  };

  const handleAddNewBike = () => {
    navigate("/bike-selector");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
      {/* Header */}
      <div className="glass-effect border-b-0 sticky top-0 z-10">
        <div className="gradient-bg p-4 text-white">
          <h1 className="text-2xl font-bold">My Garage</h1>
          <p className="text-white/80 text-sm">Select a bike to customize</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Add New Bike Card */}
          <div 
            onClick={handleAddNewBike}
            className="bike-card h-80 border-2 border-dashed border-gray-300 hover:border-blue-400 cursor-pointer group transition-all duration-300 flex flex-col items-center justify-center text-gray-500 hover:text-blue-600"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Add New Bike</h3>
            <p className="text-sm text-center px-4">Start customizing a new motorcycle</p>
          </div>

          {/* Existing Bikes */}
          {bikes.map((bike) => (
            <div key={bike.id} className="bike-card h-80 overflow-hidden group">
              {/* Bike Image */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={bike.image} 
                  alt={`${bike.brand} ${bike.model}`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                
                {/* Edit Button */}
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/30"
                >
                  <Edit className="w-4 h-4" />
                </Button>

                {/* Rating */}
                {bike.rating && (
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-white text-xs font-medium">{bike.rating}</span>
                  </div>
                )}
              </div>
              
              {/* Bike Details */}
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">
                    {bike.brand} {bike.model}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-600 text-sm mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>Year: {bike.year}</span>
                  </div>
                  
                  {bike.lastModified && (
                    <p className="text-xs text-gray-500 mb-3">
                      Last modified: {bike.lastModified}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectBike(bike);
                    }}
                  >
                    Quick View
                  </Button>
                  <Button 
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    onClick={() => handleSelectBike(bike)}
                  >
                    Customize
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-effect rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{bikes.length}</div>
            <div className="text-gray-600 font-medium">Bikes in Garage</div>
          </div>
          <div className="glass-effect rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">12</div>
            <div className="text-gray-600 font-medium">Completed Mods</div>
          </div>
          <div className="glass-effect rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">89</div>
            <div className="text-gray-600 font-medium">Community Likes</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyBikes;
