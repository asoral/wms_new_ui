
import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from "@/components/auth/AuthContext";
import { SubscriptionProvider } from "@/components/subscription/SubscriptionContext";
import { ThemeProvider } from "next-themes";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Layout from "@/components/Layout";
import { Toaster } from "@/components/ui/toaster";
import LoadingSpinner from "@/components/LoadingSpinner";

// Lazy load public pages
const LandingPage = lazy(() => import("@/components/landing/LandingPage"));
const Auth = lazy(() => import("@/pages/Auth"));
const SubscriptionSuccess = lazy(() => import("@/pages/SubscriptionSuccess"));

// Lazy load protected pages
const Home = lazy(() => import("@/pages/Home"));
const Profile = lazy(() => import("@/pages/Profile"));
const ItemEnquiry = lazy(() => import("@/pages/ItemEnquiry"));
const BinEnquiry = lazy(() => import("@/pages/BinEnquiry"));
const MaterialRequest = lazy(() => import("@/pages/MaterialRequest"));
const StockEntry = lazy(() => import("@/pages/StockEntry"));
const Receive = lazy(() => import("@/pages/Receive"));
const Deliver = lazy(() => import("@/pages/Deliver"));
const StockCount = lazy(() => import("@/pages/StockCount"));
const StockCountNew = lazy(() => import("@/pages/StockCountNew"));
const StockCountSession = lazy(() => import("@/pages/StockCountSession"));
const Packing = lazy(() => import("@/pages/Packing"));
const PickList = lazy(() => import("@/pages/PickList"));
const PrintLabel = lazy(() => import("@/pages/PrintLabel"));
const QualityCheck = lazy(() => import("@/pages/QualityCheck"));
const Pallet = lazy(() => import("@/pages/Pallet"));
const Reports = lazy(() => import("@/pages/Reports"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Sync = lazy(() => import("@/pages/Sync"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const DraftReceipts = lazy(() => import("@/pages/DraftReceipts"));
const ReceiptDetail = lazy(() => import("@/pages/ReceiptDetail"));
const SalesOrderList = lazy(() => import("@/pages/SalesOrderList"));

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
                <Suspense fallback={<LoadingSpinner />}>
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
                            <Suspense fallback={<LoadingSpinner />}>
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
                            </Suspense>
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    
                    {/* Catch-all redirect */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
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
