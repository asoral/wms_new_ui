
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Search, 
  Scan, 
  Bell, 
  User, 
  Wifi, 
  WifiOff,
  Moon,
  Sun,
  Settings,
  LogOut,
  Users,
  HelpCircle,
  Warehouse
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface TopBarProps {
  isOnline?: boolean;
  notificationCount?: number;
  onSync?: () => void;
}

const TopBar = ({ isOnline = true, notificationCount = 3, onSync }: TopBarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const isMobile = useIsMobile();

  const handleSearch = () => {
    console.log("Searching for:", searchQuery);
  };

  const handleScan = () => {
    console.log("Opening scanner...");
  };

  const handleSync = () => {
    console.log("Syncing data...");
    onSync?.();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Warehouse className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">WMS Pro</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Warehouse Management</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search or scan ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 pr-10"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleScan}
              className="absolute right-1 top-1/2 transform -translate-y-1/2"
            >
              <Scan className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          {/* Sync Button (for web view) */}
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSync}
              className="relative"
            >
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-600" />
              )}
            </Button>
          )}

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs p-0 flex items-center justify-center bg-red-500">
                {notificationCount}
              </Badge>
            )}
          </Button>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => setIsDarkMode(!isDarkMode)}>
                {isDarkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                {isDarkMode ? "Light Mode" : "Dark Mode"}
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <Warehouse className="w-4 h-4 mr-2" />
                Set Default Warehouse
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <Users className="w-4 h-4 mr-2" />
                Invite Users
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <HelpCircle className="w-4 h-4 mr-2" />
                Support
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Profile Settings
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
