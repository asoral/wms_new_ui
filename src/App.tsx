
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import PickList from "./pages/PickList";
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
              <Route path="/item-enquiry" element={<div className="p-8"><h1 className="text-2xl font-bold">Item Enquiry</h1><p>Item enquiry functionality coming soon...</p></div>} />
              <Route path="/bin-enquiry" element={<div className="p-8"><h1 className="text-2xl font-bold">Bin Enquiry</h1><p>Bin enquiry functionality coming soon...</p></div>} />
              <Route path="/stock-count" element={<div className="p-8"><h1 className="text-2xl font-bold">Stock Count</h1><p>Stock count functionality coming soon...</p></div>} />
              <Route path="/receive" element={<div className="p-8"><h1 className="text-2xl font-bold">Receive</h1><p>Receive functionality coming soon...</p></div>} />
              <Route path="/deliver" element={<div className="p-8"><h1 className="text-2xl font-bold">Deliver</h1><p>Deliver functionality coming soon...</p></div>} />
              <Route path="/mat-request" element={<div className="p-8"><h1 className="text-2xl font-bold">Material Request</h1><p>Material request functionality coming soon...</p></div>} />
              <Route path="/stock-entry" element={<div className="p-8"><h1 className="text-2xl font-bold">Stock Entry</h1><p>Stock entry functionality coming soon...</p></div>} />
              <Route path="/pick-list" element={<PickList />} />
              <Route path="/packing" element={<div className="p-8"><h1 className="text-2xl font-bold">Packing</h1><p>Packing functionality coming soon...</p></div>} />
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
