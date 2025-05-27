
import { Home, Wrench, User, Heart } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/my-bikes", icon: Wrench, label: "My Bikes" },
    { path: "/favorites", icon: Heart, label: "Favorites" },
    { path: "/profile", icon: User, label: "Profile" }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center gap-1 px-3 py-2 h-auto ${
                isActive 
                  ? "text-blue-600 bg-blue-50" 
                  : "text-gray-600 hover:text-blue-600"
              }`}
              onClick={() => navigate(item.path)}
            >
              <Icon className={`w-5 h-5 ${isActive ? "fill-current" : ""}`} />
              <span className="text-xs">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
