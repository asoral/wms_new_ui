
import { useState } from "react";
import { Heart, MessageCircle, Share, MoreHorizontal, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

const mockPosts = [
  {
    id: 1,
    user: "BikeModder01",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    bike: "Honda CB350",
    description: "Just finished my cafe racer conversion! New exhaust and seat looking amazing 🔥 This build took me 3 months but totally worth it!",
    image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&h=400&fit=crop",
    likes: 234,
    comments: 45,
    timeAgo: "2h",
    tags: ["#caferacer", "#honda", "#custom"]
  },
  {
    id: 2,
    user: "CruiserKing",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    bike: "Royal Enfield Classic 350",
    description: "Scrambler build complete! Added knobby tires and bash plate for off-road adventures. Ready to hit the trails! 🏔️",
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&h=400&fit=crop",
    likes: 189,
    comments: 32,
    timeAgo: "4h",
    tags: ["#scrambler", "#royalenfield", "#offroad"]
  },
  {
    id: 3,
    user: "SportBikeQueen",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b739?w=100&h=100&fit=crop&crop=face",
    bike: "Yamaha R15",
    description: "Track-ready build with full Akrapovic exhaust system and race fairings. Can't wait to test this beast! 🏁",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
    likes: 567,
    comments: 89,
    timeAgo: "6h",
    tags: ["#sportbike", "#yamaha", "#track"]
  },
  {
    id: 4,
    user: "VintageRider",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    bike: "Kawasaki W650",
    description: "Classic restoration with modern touches. Original paint restored to perfection! ✨",
    image: "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=600&h=400&fit=crop",
    likes: 345,
    comments: 56,
    timeAgo: "8h",
    tags: ["#vintage", "#kawasaki", "#restoration"]
  }
];

const Home = () => {
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [savedPosts, setSavedPosts] = useState<number[]>([]);

  const toggleLike = (postId: number) => {
    setLikedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const toggleSave = (postId: number) => {
    setSavedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
      {/* Header with gradient */}
      <div className="glass-effect border-b-0 sticky top-0 z-10">
        <div className="gradient-bg p-4 text-white">
          <h1 className="text-2xl font-bold">Bike Mods Community</h1>
          <p className="text-white/80 text-sm">Discover amazing bike modifications</p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 py-6">
          {mockPosts.map((post) => (
            <div key={post.id} className="bike-card overflow-hidden">
              {/* Post Header */}
              <div className="flex items-center justify-between p-4 pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 ring-2 ring-blue-500/20">
                    <img src={post.avatar} alt={post.user} className="w-full h-full object-cover" />
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900">{post.user}</p>
                    <p className="text-xs text-gray-500">{post.bike} • {post.timeAgo}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>

              {/* Post Image */}
              <div className="relative w-full h-64 bg-gray-200 overflow-hidden">
                <img src={post.image} alt="Bike mod" className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* Post Actions */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleLike(post.id)}
                      className={`transition-colors ${likedPosts.includes(post.id) ? "text-red-500 hover:text-red-600" : "text-gray-600 hover:text-red-500"}`}
                    >
                      <Heart className={`w-5 h-5 ${likedPosts.includes(post.id) ? "fill-current" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-500">
                      <MessageCircle className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-green-500">
                      <Share className="w-5 h-5" />
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => toggleSave(post.id)}
                    className={`transition-colors ${savedPosts.includes(post.id) ? "text-blue-500 hover:text-blue-600" : "text-gray-600 hover:text-blue-500"}`}
                  >
                    <Bookmark className={`w-5 h-5 ${savedPosts.includes(post.id) ? "fill-current" : ""}`} />
                  </Button>
                </div>

                <p className="font-semibold text-sm mb-2 text-gray-900">
                  {post.likes + (likedPosts.includes(post.id) ? 1 : 0)} likes
                </p>
                <p className="text-sm text-gray-700 leading-relaxed mb-2">{post.description}</p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {post.tags.map((tag, index) => (
                    <span key={index} className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <p className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  View all {post.comments} comments
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
