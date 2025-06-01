
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Zap, 
  BarChart3, 
  Wifi, 
  WifiOff, 
  Search,
  Plus
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface BottomNavigationProps {
  isOnline?: boolean;
  onSync?: () => void;
}

const BottomNavigation = ({ isOnline = true, onSync }: BottomNavigationProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [actionsOpen, setActionsOpen] = useState(false);

  const navItems = [
    { path: "/", icon: Home, label: "Dashboard" },
    { path: "/actions", icon: Zap, label: "Actions", isAction: true },
    { path: "/reports", icon: BarChart3, label: "Reports", isReport: true },
    { path: "/sync", icon: isOnline ? Wifi : WifiOff, label: "Sync", isSync: true },
    { path: "/item-enquiry", icon: Search, label: "Item Enquiry" }
  ];

  const actionItems = [
    { path: "/item-enquiry", label: "Item Enquiry", icon: "🔍" },
    { path: "/bin-enquiry", label: "Bin Enquiry", icon: "📦" },
    { path: "/stock-count", label: "Stock Count", icon: "🔢" },
    { path: "/receive", label: "Receive", icon: "📥" },
    { path: "/deliver", label: "Deliver", icon: "🚚" },
    { path: "/mat-request", label: "Material Request", icon: "📋" },
    { path: "/stock-entry", label: "Stock Entry", icon: "📊" },
    { path: "/pick-list", label: "Pick List", icon: "📝" },
    { path: "/packing", label: "Packing", icon: "📦" },
    { path: "/print-label", label: "Print Label", icon: "🏷️" },
    { path: "/quality-check", label: "Quality Check", icon: "✅" },
    { path: "/pallet", label: "Pallet", icon: "🏗️" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleNavigation = (item: any) => {
    if (item.isAction) {
      setActionsOpen(true);
    } else if (item.isSync) {
      navigate("/sync");
    } else if (item.isReport) {
      navigate("/reports");
    } else {
      navigate(item.path);
    }
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center gap-1 px-3 py-2 h-auto rounded-none ${
                  active 
                    ? "text-blue-600 bg-blue-50" 
                    : "text-gray-600 hover:text-blue-600"
                }`}
                onClick={() => handleNavigation(item)}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${item.isSync && !isOnline ? 'text-red-500' : ''}`} />
                  {item.isSync && !isOnline && (
                    <Badge className="absolute -top-1 -right-1 h-2 w-2 rounded-full p-0 bg-red-500" />
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Floating Action Button */}
      <Button
        size="icon"
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-40 md:hidden"
        onClick={() => console.log("Quick action")}
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Actions Sheet */}
      <Sheet open={actionsOpen} onOpenChange={setActionsOpen}>
        <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Quick Actions</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-4 mt-6 pb-6">
            {actionItems.map((action) => (
              <Button
                key={action.path}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={() => {
                  navigate(action.path);
                  setActionsOpen(false);
                }}
              >
                <span className="text-2xl">{action.icon}</span>
                <span className="text-sm font-medium text-center">{action.label}</span>
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default BottomNavigation;
