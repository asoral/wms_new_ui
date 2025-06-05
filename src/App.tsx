
import { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from "@/components/auth/AuthContext";
import { SubscriptionProvider } from "@/components/subscription/SubscriptionContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SubscriptionGuard from "@/components/subscription/SubscriptionGuard";
import BottomNavigation from "@/components/BottomNavigation";
import TopBar from "@/components/TopBar";
import { Toaster } from "@/components/ui/sonner";
import AuthForm from "@/components/auth/AuthForm";

// Lazy load pages to improve performance
const Index = lazy(() => import("@/pages/Index"));
const Home = lazy(() => import("@/pages/Home"));
const Receive = lazy(() => import("@/pages/Receive"));
const PickList = lazy(() => import("@/pages/PickList"));
const StockEntry = lazy(() => import("@/pages/StockEntry"));
const ItemEnquiry = lazy(() => import("@/pages/ItemEnquiry"));
const BinEnquiry = lazy(() => import("@/pages/BinEnquiry"));
const Deliver = lazy(() => import("@/pages/Deliver"));
const Packing = lazy(() => import("@/pages/Packing"));
const StockCount = lazy(() => import("@/pages/StockCount"));
const Pallet = lazy(() => import("@/pages/Pallet"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Profile = lazy(() => import("@/pages/Profile"));
const MaterialRequest = lazy(() => import("@/pages/MaterialRequest"));
const Reports = lazy(() => import("@/pages/Reports"));
const PrintLabel = lazy(() => import("@/pages/PrintLabel"));
const QualityCheck = lazy(() => import("@/pages/QualityCheck"));
const Sync = lazy(() => import("@/pages/Sync"));
const SubscriptionSuccess = lazy(() => import("@/pages/SubscriptionSuccess"));
const MakePaymentExempt = lazy(() => import("@/pages/MakePaymentExempt"));

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <SubscriptionProvider>
          <div className="flex flex-col h-screen overflow-hidden">
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
                {/* Public routes */}
                <Route path="/auth" element={<AuthForm />} />
                <Route path="/subscription-success" element={<SubscriptionSuccess />} />
                <Route path="/make-payment-exempt" element={<MakePaymentExempt />} />
                <Route path="/" element={<Index />} />

                {/* Protected routes that require authentication */}
                <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
                  <Route element={<SubscriptionGuard><Outlet /></SubscriptionGuard>}>
                    <Route element={<>
                      <TopBar />
                      <div className="flex-1 overflow-hidden">
                        <Outlet />
                      </div>
                      <BottomNavigation />
                    </>}>
                      <Route path="/home" element={<Home />} />
                      <Route path="/receive" element={<Receive />} />
                      <Route path="/pick-list" element={<PickList />} />
                      <Route path="/stock-entry" element={<StockEntry />} />
                      <Route path="/material-request" element={<MaterialRequest />} />
                      <Route path="/packing" element={<Packing />} />
                      <Route path="/deliver" element={<Deliver />} />
                      <Route path="/item-enquiry" element={<ItemEnquiry />} />
                      <Route path="/bin-enquiry" element={<BinEnquiry />} />
                      <Route path="/stock-count" element={<StockCount />} />
                      <Route path="/pallet" element={<Pallet />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/print-label" element={<PrintLabel />} />
                      <Route path="/quality" element={<QualityCheck />} />
                      <Route path="/sync" element={<Sync />} />
                      <Route path="*" element={<NotFound />} />
                    </Route>
                  </Route>
                </Route>
              </Routes>
            </Suspense>
            <Toaster />
          </div>
        </SubscriptionProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
