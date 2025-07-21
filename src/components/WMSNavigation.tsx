
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Package, 
  Search, 
  BarChart3, 
  ShoppingCart, 
  Truck, 
  FileText, 
  CheckCircle, 
  Printer,
  Database,
  Layers,
  ClipboardList,
  Package2,
  Menu,
  X,
  Warehouse
} from "lucide-react";

const WMSNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    { icon: Home, label: "Dashboard", path: "/app/home" },
    { icon: Package, label: "Item Enquiry", path: "/app/item-enquiry" },
    { icon: Search, label: "Bin Enquiry", path: "/app/bin-enquiry" },
    { icon: BarChart3, label: "Stock Count", path: "/app/stock-count" },
    { icon: ShoppingCart, label: "Receive", path: "/app/receive" },
    { icon: Truck, label: "Deliver", path: "/app/deliver" },
    { icon: FileText, label: "Material Request", path: "/app/material-request" },
    { icon: Database, label: "Stock Entry", path: "/app/stock-entry" },
    { icon: ClipboardList, label: "Pick List", path: "/app/pick-list" },
    { icon: Package2, label: "Packing", path: "/app/packing" },
    { icon: Printer, label: "Print Label", path: "/app/print-label" },
    { icon: CheckCircle, label: "Quality Check", path: "/app/quality" },
    { icon: Layers, label: "Pallet", path: "/app/pallet" },
    { icon: BarChart3, label: "Reports", path: "/app/reports" }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-sidebar shadow-lg"
        >
          {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Sidebar - Always visible on desktop */}
      <div className={`
        fixed left-0 top-0 h-screen bg-sidebar shadow-lg z-40 w-64 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:shadow-none md:border-r border-gray-200
        flex flex-col
      `}>
        {/* App Header with Icon - Always visible */}
        <div className="p-4 border-b border-gray-200 bg-blue-600">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-sidebar-accent rounded-lg flex items-center justify-center">
              <Warehouse className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-white">
              <h1 className="font-bold text-lg">WMS</h1>
              <p className="text-xs text-blue-100">Warehouse Management</p>
            </div>
          </div>
        </div>

        {/* Navigation - Scrollable independently */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Button
                key={index}
                variant={active ? "default" : "ghost"}
                className={`w-full justify-start space-x-3 h-11 ${
                  active 
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm" 
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground"
                }`}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-blue-600'}`} />
                <span className="font-medium">{item.label}</span>
              </Button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-muted-foreground text-center">
            Version 1.0.0
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default WMSNavigation;
