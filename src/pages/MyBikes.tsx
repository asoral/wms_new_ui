import { useState } from "react";
import { Plus, Edit, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Bike {
  id: number;
  brand: string;
  model: string;
  year: number;
  image: string;
}

const MyBikes = () => {
  const navigate = useNavigate();
  const [bikes, setBikes] = useState<Bike[]>([
    {
      id: 1,
      brand: "Honda",
      model: "CB350",
      year: 2022,
      image: "/placeholder.svg"
    }
  ]);

  const handleSelectBike = (bike: Bike) => {
    navigate(`/customize/${bike.id}`, { state: { bike } });
  };

  const handleAddNewBike = () => {
    navigate("/bike-selector");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b p-4">
        <h1 className="text-xl font-bold">My Bikes</h1>
        <p className="text-sm text-gray-600">Select a bike to customize</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Add New Bike Button */}
        <Button 
          onClick={handleAddNewBike}
          className="w-full h-16 border-2 border-dashed border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
          variant="outline"
        >
          <Plus className="w-6 h-6 mr-2" />
          Add New Bike
        </Button>

        {/* Existing Bikes */}
        {bikes.map((bike) => (
          <div key={bike.id} className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-200 rounded-lg">
                <img src={bike.image} alt={`${bike.brand} ${bike.model}`} className="w-full h-full object-cover rounded-lg" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{bike.brand} {bike.model}</h3>
                <p className="text-gray-600">Year: {bike.year}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleSelectBike(bike)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Button 
              className="w-full mt-4" 
              onClick={() => handleSelectBike(bike)}
            >
              Customize This Bike
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyBikes;
