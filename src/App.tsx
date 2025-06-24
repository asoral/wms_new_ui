
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Layout from "./components/Layout";
import { AuthProvider } from "./components/auth/AuthContext";
import { SubscriptionProvider } from "./components/subscription/SubscriptionContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Import pages
import Index from "./pages/Index";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import ItemEnquiry from "./pages/ItemEnquiry";
import BinEnquiry from "./pages/BinEnquiry";
import StockCount from "./pages/StockCount";
import Receive from "./pages/Receive";
import Deliver from "./pages/Deliver";
import MaterialRequest from "./pages/MaterialRequest";
import StockEntry from "./pages/StockEntry";
import PickList from "./pages/PickList";
import Packing from "./pages/Packing";
import QualityCheck from "./pages/QualityCheck";
import PrintLabel from "./pages/PrintLabel";
import Pallet from "./pages/Pallet";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import Sync from "./pages/Sync";
import DraftReceipts from "./pages/DraftReceipts";
import ReceiptDetail from "./pages/ReceiptDetail";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <SubscriptionProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/subscription-success" element={<SubscriptionSuccess />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Index />} />
                  <Route path="home" element={<Home />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="item-enquiry" element={<ItemEnquiry />} />
                  <Route path="bin-enquiry" element={<BinEnquiry />} />
                  <Route path="stock-count" element={<StockCount />} />
                  <Route path="receive" element={<Receive />} />
                  <Route path="deliver" element={<Deliver />} />
                  <Route path="material-request" element={<MaterialRequest />} />
                  <Route path="stock-entry" element={<StockEntry />} />
                  <Route path="pick-list" element={<PickList />} />
                  <Route path="packing" element={<Packing />} />
                  <Route path="quality-check" element={<QualityCheck />} />
                  <Route path="print-label" element={<PrintLabel />} />
                  <Route path="pallet" element={<Pallet />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="sync" element={<Sync />} />
                  <Route path="draft-receipts" element={<DraftReceipts />} />
                  <Route path="receipt/:id" element={<ReceiptDetail />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </SubscriptionProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
