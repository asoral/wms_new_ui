
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from "@/components/auth/AuthContext";
import { SubscriptionProvider } from "@/components/subscription/SubscriptionContext";
import { ThemeProvider } from "next-themes";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Layout from "@/components/Layout";
import { Toaster } from "@/components/ui/toaster";

// Public Pages
import LandingPage from "@/components/landing/LandingPage";
import Auth from "@/pages/Auth";
import SubscriptionSuccess from "@/pages/SubscriptionSuccess";

// Protected Pages
import Home from "@/pages/Home";
import Profile from "@/pages/Profile";
import ItemEnquiry from "@/pages/ItemEnquiry";
import BinEnquiry from "@/pages/BinEnquiry";
import MaterialRequest from "@/pages/MaterialRequest";
import StockEntry from "@/pages/StockEntry";
import Receive from "@/pages/Receive";
import Deliver from "@/pages/Deliver";
import StockCount from "@/pages/StockCount";
import StockCountNew from "@/pages/StockCountNew";
import StockCountSession from "@/pages/StockCountSession";
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
import SalesOrderList from "@/pages/SalesOrderList";

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
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/subscription-success" element={<SubscriptionSuccess />} />
                  
                  {/* Protected App Routes */}
                  <Route
                    path="/app/*"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Routes>
                            <Route path="/" element={<Navigate to="/app/home" replace />} />
                            <Route path="/home" element={<Home />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/item-enquiry" element={<ItemEnquiry />} />
                            <Route path="/bin-enquiry" element={<BinEnquiry />} />
                            <Route path="/material-request" element={<MaterialRequest />} />
                            <Route path="/mat-request" element={<MaterialRequest />} />
                            <Route path="/stock-entry" element={<StockEntry />} />
                            <Route path="/receive" element={<Receive />} />
                            <Route path="/deliver" element={<Deliver />} />
                            <Route path="/stock-count" element={<StockCount />} />
                            <Route path="/stock-count/new" element={<StockCountNew />} />
                            <Route path="/stock-count/session" element={<StockCountSession />} />
                            <Route path="/packing" element={<Packing />} />
                            <Route path="/pick-list" element={<PickList />} />
                            <Route path="/print-label" element={<PrintLabel />} />
                            <Route path="/quality-check" element={<QualityCheck />} />
                            <Route path="/pallet" element={<Pallet />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/notifications" element={<Notifications />} />
                            <Route path="/sync" element={<Sync />} />
                            <Route path="/sales-orders" element={<SalesOrderList />} />
                            <Route path="/draft-receipts" element={<DraftReceipts />} />
                            <Route path="/receipt/:id" element={<ReceiptDetail />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Catch-all redirect */}
                  <Route path="*" element={<Navigate to="/app/home" replace />} />
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
