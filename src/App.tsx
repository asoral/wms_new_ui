
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import Home from "./pages/Home";
import PickList from "./pages/PickList";
import ItemEnquiry from "./pages/ItemEnquiry";
import BinEnquiry from "./pages/BinEnquiry";
import StockCount from "./pages/StockCount";
import Receive from "./pages/Receive";
import Deliver from "./pages/Deliver";
import MaterialRequest from "./pages/MaterialRequest";
import StockEntry from "./pages/StockEntry";
import Packing from "./pages/Packing";
import PrintLabel from "./pages/PrintLabel";
import QualityCheck from "./pages/QualityCheck";
import Pallet from "./pages/Pallet";
import Reports from "./pages/Reports";
import Sync from "./pages/Sync";
import Notifications from "./pages/Notifications";
import WMSNavigation from "./components/WMSNavigation";
import TopBar from "./components/TopBar";
import BottomNavigation from "./components/BottomNavigation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const isMobile = useIsMobile();

  const handleSync = () => {
    console.log("Syncing data...");
    // Add sync logic here
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex flex-col min-h-screen">
            {/* Top Bar - always visible */}
            <TopBar onSync={handleSync} />
            
            <div className="flex flex-1">
              {/* Desktop Sidebar - only on desktop */}
              {!isMobile && <WMSNavigation />}
              
              {/* Main Content Area */}
              <div className="flex-1 pb-16 md:pb-0">
                <Routes>
                  <Route path="/" element={<Home />} />
                  
                  {/* WMS Routes */}
                  <Route path="/item-enquiry" element={<ItemEnquiry />} />
                  <Route path="/bin-enquiry" element={<BinEnquiry />} />
                  <Route path="/stock-count" element={<StockCount />} />
                  <Route path="/receive" element={<Receive />} />
                  <Route path="/deliver" element={<Deliver />} />
                  <Route path="/mat-request" element={<MaterialRequest />} />
                  <Route path="/stock-entry" element={<StockEntry />} />
                  <Route path="/pick-list" element={<PickList />} />
                  <Route path="/packing" element={<Packing />} />
                  <Route path="/print-label" element={<PrintLabel />} />
                  <Route path="/quality-check" element={<QualityCheck />} />
                  <Route path="/pallet" element={<Pallet />} />
                  
                  {/* New Routes */}
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/sync" element={<Sync />} />
                  <Route path="/notifications" element={<Notifications />} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </div>

            {/* Bottom Navigation - only on mobile */}
            {isMobile && <BottomNavigation onSync={handleSync} />}
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
