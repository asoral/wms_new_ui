
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Settings, Edit, Share } from "lucide-react";

const Profile = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b">
        <div className="p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Profile</h1>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-4 text-center">
          <Avatar className="w-24 h-24 mx-auto mb-4">
            <img src="/placeholder.svg" alt="Profile" className="w-full h-full object-cover" />
          </Avatar>
          <h2 className="text-xl font-bold">BikeModder01</h2>
          <p className="text-gray-600">Bike enthusiast & modifier</p>
          
          <div className="flex justify-center gap-8 mt-4">
            <div className="text-center">
              <p className="text-xl font-bold">12</p>
              <p className="text-sm text-gray-600">Builds</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">1.2k</p>
              <p className="text-sm text-gray-600">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">890</p>
              <p className="text-sm text-gray-600">Following</p>
            </div>
          </div>
          
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
            <Button variant="outline">
              <Share className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">My Builds</h3>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="bg-white rounded-lg overflow-hidden shadow-sm">
              <div className="w-full h-32 bg-gray-200">
                <img src="/placeholder.svg" alt="Build" className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <p className="font-medium text-sm">Cafe Racer Build</p>
                <p className="text-xs text-gray-600">Honda CB350</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
