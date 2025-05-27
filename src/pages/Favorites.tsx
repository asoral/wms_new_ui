
import { Heart, MessageCircle, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

const mockFavorites = [
  {
    id: 1,
    user: "CafeRacerPro",
    avatar: "/placeholder.svg",
    bike: "Honda CB350",
    description: "Minimalist cafe racer build with custom tank and seat",
    image: "/placeholder.svg",
    likes: 456,
    comments: 67
  },
  {
    id: 2,
    user: "ScramblerBeast",
    avatar: "/placeholder.svg",
    bike: "Royal Enfield Himalayan",
    description: "Adventure-ready scrambler with crash guards and luggage",
    image: "/placeholder.svg",
    likes: 234,
    comments: 34
  }
];

const Favorites = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b p-4">
        <h1 className="text-xl font-bold">Favorites</h1>
        <p className="text-sm text-gray-600">Your saved bike builds</p>
      </div>
      
      <div className="space-y-4 p-4">
        {mockFavorites.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow-sm border">
            <div className="flex items-center gap-3 p-4">
              <Avatar className="w-10 h-10">
                <img src={post.avatar} alt={post.user} className="w-full h-full object-cover" />
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{post.user}</p>
                <p className="text-xs text-gray-500">{post.bike}</p>
              </div>
            </div>

            <div className="w-full h-48 bg-gray-200">
              <img src={post.image} alt="Bike build" className="w-full h-full object-cover" />
            </div>

            <div className="p-4">
              <div className="flex items-center gap-4 mb-3">
                <Button variant="ghost" size="sm" className="text-red-500">
                  <Heart className="w-5 h-5 fill-current" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MessageCircle className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Share className="w-5 h-5" />
                </Button>
              </div>

              <p className="font-semibold text-sm mb-1">{post.likes} likes</p>
              <p className="text-sm">{post.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Favorites;
