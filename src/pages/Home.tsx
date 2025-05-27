
import { useState } from "react";
import { Heart, MessageCircle, Share, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

const mockPosts = [
  {
    id: 1,
    user: "BikeModder01",
    avatar: "/placeholder.svg",
    bike: "Honda CB350",
    description: "Just finished my cafe racer conversion! New exhaust and seat looking amazing 🔥",
    image: "/placeholder.svg",
    likes: 234,
    comments: 45,
    timeAgo: "2h"
  },
  {
    id: 2,
    user: "CruiserKing",
    avatar: "/placeholder.svg",
    bike: "Royal Enfield Classic 350",
    description: "Scrambler build complete! Added knobby tires and bash plate for off-road adventures",
    image: "/placeholder.svg",
    likes: 189,
    comments: 32,
    timeAgo: "4h"
  }
];

const Home = () => {
  const [likedPosts, setLikedPosts] = useState<number[]>([]);

  const toggleLike = (postId: number) => {
    setLikedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b p-4">
        <h1 className="text-xl font-bold">Bike Mods Feed</h1>
      </div>
      
      <div className="space-y-4 p-4">
        {mockPosts.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow-sm border">
            {/* Post Header */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <img src={post.avatar} alt={post.user} className="w-full h-full object-cover" />
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{post.user}</p>
                  <p className="text-xs text-gray-500">{post.bike} • {post.timeAgo}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>

            {/* Post Image */}
            <div className="w-full h-64 bg-gray-200">
              <img src={post.image} alt="Bike mod" className="w-full h-full object-cover" />
            </div>

            {/* Post Actions */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleLike(post.id)}
                    className={likedPosts.includes(post.id) ? "text-red-500" : ""}
                  >
                    <Heart className={`w-5 h-5 ${likedPosts.includes(post.id) ? "fill-current" : ""}`} />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <p className="font-semibold text-sm mb-1">{post.likes + (likedPosts.includes(post.id) ? 1 : 0)} likes</p>
              <p className="text-sm">{post.description}</p>
              <p className="text-xs text-gray-500 mt-2">View all {post.comments} comments</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
