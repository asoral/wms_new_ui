
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from "@/components/auth/AuthContext";
import { SubscriptionProvider } from "@/components/subscription/SubscriptionContext";
import { ThemeProvider } from "next-themes";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Layout from "@/components/Layout";
import { Toaster } from "@/components/ui/toaster";

// Pages
import Home from "@/pages/Home";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Profile from "@/pages/Profile";
import ItemEnquiry from "@/pages/ItemEnquiry";
import BinEnquiry from "@/pages/BinEnquiry";
import MaterialRequest from "@/pages/MaterialRequest";
import StockEntry from "@/pages/StockEntry";
import Receive from "@/pages/Receive";
import Deliver from "@/pages/Deliver";
import StockCount from "@/pages/StockCount";
import Packing from "@/pages/Packing";
import PickList from "@/pages/PickList";
import PrintLabel from "@/pages/PrintLabel";
import QualityCheck from "@/pages/QualityCheck";
import Pallet from "@/pages/Pallet";
import Reports from "@/pages/Reports";
import Notifications from "@/pages/Notifications";
import Sync from "@/pages/Sync";
import NotFound from "@/pages/NotFound";
import DraftReceipts from "@/pages/DraftReceipts";
import ReceiptDetail from "@/pages/ReceiptDetail";
import SubscriptionSuccess from "@/pages/SubscriptionSuccess";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Router>
          <AuthProvider>
            <SubscriptionProvider>
              <div className="min-h-screen bg-background">
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/subscription-success" element={<SubscriptionSuccess />} />
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/index" element={<Index />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/item-enquiry" element={<ItemEnquiry />} />
                            <Route path="/bin-enquiry" element={<BinEnquiry />} />
                            <Route path="/material-request" element={<MaterialRequest />} />
                            <Route path="/stock-entry" element={<StockEntry />} />
                            <Route path="/receive" element={<Receive />} />
                            <Route path="/deliver" element={<Deliver />} />
                            <Route path="/stock-count" element={<StockCount />} />
                            <Route path="/packing" element={<Packing />} />
                            <Route path="/pick-list" element={<PickList />} />
                            <Route path="/print-label" element={<PrintLabel />} />
                            <Route path="/quality-check" element={<QualityCheck />} />
                            <Route path="/pallet" element={<Pallet />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/notifications" element={<Notifications />} />
                            <Route path="/sync" element={<Sync />} />
                            <Route path="/draft-receipts" element={<DraftReceipts />} />
                            <Route path="/receipt/:id" element={<ReceiptDetail />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </div>
              <Toaster />
            </SubscriptionProvider>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
