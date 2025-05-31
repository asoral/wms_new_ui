
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import WMSNavigation from "./components/WMSNavigation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex min-h-screen">
          {/* WMS Navigation Sidebar */}
          <WMSNavigation />
          
          {/* Main Content Area */}
          <div className="flex-1">
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
              <Route path="/print-label" element={<div className="p-8"><h1 className="text-2xl font-bold">Print Label</h1><p>Print label functionality coming soon...</p></div>} />
              <Route path="/quality-check" element={<div className="p-8"><h1 className="text-2xl font-bold">Quality Check</h1><p>Quality check functionality coming soon...</p></div>} />
              <Route path="/pallet" element={<div className="p-8"><h1 className="text-2xl font-bold">Pallet</h1><p>Pallet functionality coming soon...</p></div>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
