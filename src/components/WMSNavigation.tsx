
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
  X
} from "lucide-react";

const WMSNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    { icon: Home, label: "Dashboard", path: "/" },
    { icon: Package, label: "Item Enquiry", path: "/item-enquiry" },
    { icon: Search, label: "Bin Enquiry", path: "/bin-enquiry" },
    { icon: BarChart3, label: "Stock Count", path: "/stock-count" },
    { icon: ShoppingCart, label: "Receive", path: "/receive" },
    { icon: Truck, label: "Deliver", path: "/deliver" },
    { icon: FileText, label: "Material Request", path: "/mat-request" },
    { icon: Database, label: "Stock Entry", path: "/stock-entry" },
    { icon: ClipboardList, label: "Pick List", path: "/pick-list" },
    { icon: Package2, label: "Packing", path: "/packing" },
    { icon: Printer, label: "Print Label", path: "/print-label" },
    { icon: CheckCircle, label: "Quality Check", path: "/quality-check" },
    { icon: Layers, label: "Pallet", path: "/pallet" }
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
          className="bg-white shadow-lg"
        >
          {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full bg-white shadow-lg z-40 w-64 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:shadow-none md:border-r
      `}>
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">WMS</h2>
          <p className="text-sm text-gray-600">Warehouse Management</p>
        </div>
        
        <nav className="p-4 space-y-2">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Button
                key={index}
                variant={isActive(item.path) ? "default" : "ghost"}
                className={`w-full justify-start space-x-3 ${
                  isActive(item.path) 
                    ? "bg-blue-600 text-white hover:bg-blue-700" 
                    : "hover:bg-gray-100"
                }`}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Button>
            );
          })}
        </nav>
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
