
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Bell, 
  User, 
  Wifi, 
  WifiOff, 
  Moon, 
  Sun, 
  Settings, 
  LogOut,
  Warehouse,
  Users,
  HelpCircle,
  BarChart3
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/components/auth/AuthContext";

interface TopBarProps {
  onSync?: () => void;
  isOnline?: boolean;
}

const TopBar = ({ onSync, isOnline = true }: TopBarProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { signOut, user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Mock notification count
  const unreadNotifications = 3;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log("Searching/Scanning for:", searchQuery);
      
      // Global search logic
      const query = searchQuery.trim().toLowerCase();
      
      // Check if it's a warehouse/bin search
      if (query.includes('wh-') || query.includes('warehouse') || query.includes('bin-')) {
        navigate(`/bin-enquiry?search=${encodeURIComponent(searchQuery)}`);
        return;
      }
      
      // Check if it's a purchase order
      if (query.includes('po-') || query.includes('pur-ord')) {
        navigate(`/receive?po=${encodeURIComponent(searchQuery)}`);
        return;
      }
      
      // Check if it's a sales order
      if (query.includes('so-') || query.includes('sal-ord')) {
        navigate(`/deliver?so=${encodeURIComponent(searchQuery)}`);
        return;
      }
      
      // Default to item enquiry for any other search
      navigate(`/item-enquiry?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleNotificationClick = () => {
    navigate("/notifications");
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // Implement dark mode toggle logic
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        {/* Left Section - Logo & App Name (Mobile Only) */}
        <div className="flex items-center space-x-4">
          {isMobile && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Warehouse className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">WMS</span>
            </div>
          )}
        </div>

        {/* Center Section - Search/Scan */}
        <div className="flex-1 max-w-lg mx-8">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Search or scan items, orders, warehouses..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-2">
          {/* Reports (Desktop only) */}
          {!isMobile && (
            <Button variant="ghost" size="icon" onClick={() => navigate("/reports")}>
              <BarChart3 className="w-5 h-5" />
            </Button>
          )}

          {/* Sync (Desktop only) */}
          {!isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/sync")}
              className="relative"
            >
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-600" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-600" />
              )}
              {!isOnline && (
                <Badge className="absolute -top-1 -right-1 h-2 w-2 rounded-full p-0 bg-red-500" />
              )}
            </Button>
          )}

          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={handleNotificationClick}
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 bg-red-500 text-xs text-white flex items-center justify-center">
                {unreadNotifications}
              </Badge>
            )}
          </Button>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                {user?.email || 'My Account'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={toggleDarkMode}>
                {darkMode ? (
                  <>
                    <Sun className="w-4 h-4 mr-2" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 mr-2" />
                    Dark Mode
                  </>
                )}
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <Warehouse className="w-4 h-4 mr-2" />
                Set Default Warehouse
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem>
                <HelpCircle className="w-4 h-4 mr-2" />
                Support
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <Users className="w-4 h-4 mr-2" />
                Invite Users
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Profile Settings
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem className="text-red-600" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
