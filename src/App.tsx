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
import LoadingSpinner from "@/components/LoadingSpinner";

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

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <SubscriptionProvider>
          <div className="flex flex-col h-screen">
            <Suspense fallback={
              <div className="flex items-center justify-center h-screen">
                <LoadingSpinner size={48} />
              </div>
            }>
              <Routes>
                {/* Public routes */}
                <Route path="/auth" element={<AuthForm />} />
                <Route path="/subscription-success" element={<SubscriptionSuccess />} />
                <Route path="/" element={<Navigate to="/home" replace />} />

                {/* Protected routes that require authentication and subscription */}
                <Route path="/home" element={
                  <ProtectedRoute>
                    <SubscriptionGuard>
                      <TopBar />
                      <div className="flex-1 overflow-y-auto">
                        <Home />
                      </div>
                      <BottomNavigation />
                    </SubscriptionGuard>
                  </ProtectedRoute>
                } />
                
                <Route path="/receive" element={
                  <ProtectedRoute>
                    <SubscriptionGuard>
                      <TopBar />
                      <div className="flex-1 overflow-y-auto">
                        <Receive />
                      </div>
                      <BottomNavigation />
                    </SubscriptionGuard>
                  </ProtectedRoute>
                } />
                
                <Route path="/pick-list" element={
                  <ProtectedRoute>
                    <SubscriptionGuard>
                      <TopBar />
                      <div className="flex-1 overflow-y-auto">
                        <PickList />
                      </div>
                      <BottomNavigation />
                    </SubscriptionGuard>
                  </ProtectedRoute>
                } />
                
                <Route path="/stock-entry" element={
                  <ProtectedRoute>
                    <SubscriptionGuard>
                      <TopBar />
                      <div className="flex-1 overflow-y-auto">
                        <StockEntry />
                      </div>
                      <BottomNavigation />
                    </SubscriptionGuard>
                  </ProtectedRoute>
                } />
                
                <Route path="/material-request" element={
                  <ProtectedRoute>
                    <SubscriptionGuard>
                      <TopBar />
                      <div className="flex-1 overflow-y-auto">
                        <MaterialRequest />
                      </div>
                      <BottomNavigation />
                    </SubscriptionGuard>
                  </ProtectedRoute>
                } />
                
                <Route path="/packing" element={
                  <ProtectedRoute>
                    <SubscriptionGuard>
                      <TopBar />
                      <div className="flex-1 overflow-y-auto">
                        <Packing />
                      </div>
                      <BottomNavigation />
                    </SubscriptionGuard>
                  </ProtectedRoute>
                } />
                
                <Route path="/deliver" element={
                  <ProtectedRoute>
                    <SubscriptionGuard>
                      <TopBar />
                      <div className="flex-1 overflow-y-auto">
                        <Deliver />
                      </div>
                      <BottomNavigation />
                    </SubscriptionGuard>
                  </ProtectedRoute>
                } />
                
                <Route path="/item-enquiry" element={
                  <ProtectedRoute>
                    <SubscriptionGuard>
                      <TopBar />
                      <div className="flex-1 overflow-y-auto">
                        <ItemEnquiry />
                      </div>
                      <BottomNavigation />
                    </SubscriptionGuard>
                  </ProtectedRoute>
                } />
                
                <Route path="/bin-enquiry" element={
                  <ProtectedRoute>
                    <SubscriptionGuard>
                      <TopBar />
                      <div className="flex-1 overflow-y-auto">
                        <BinEnquiry />
                      </div>
                      <BottomNavigation />
                    </SubscriptionGuard>
                  </ProtectedRoute>
                } />
                
                <Route path="/stock-count" element={
                  <ProtectedRoute>
                    <SubscriptionGuard>
                      <TopBar />
                      <div className="flex-1 overflow-y-auto">
                        <StockCount />
                      </div>
                      <BottomNavigation />
                    </SubscriptionGuard>
                  </ProtectedRoute>
                } />
                
                <Route path="/pallet" element={
                  <ProtectedRoute>
                    <SubscriptionGuard>
                      <TopBar />
                      <div className="flex-1 overflow-y-auto">
                        <Pallet />
                      </div>
                      <BottomNavigation />
                    </SubscriptionGuard>
                  </ProtectedRoute>
                } />
                
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <SubscriptionGuard>
                      <TopBar />
                      <div className="flex-1 overflow-y-auto">
                        <Profile />
                      </div>
                      <BottomNavigation />
                    </SubscriptionGuard>
                  </ProtectedRoute>
                } />
                
                <Route path="/reports" element={
                  <ProtectedRoute>
                    <SubscriptionGuard>
                      <TopBar />
                      <div className="flex-1 overflow-y-auto">
                        <Reports />
                      </div>
                      <BottomNavigation />
                    </SubscriptionGuard>
                  </ProtectedRoute>
                } />
                
                <Route path="/print-label" element={
                  <ProtectedRoute>
                    <SubscriptionGuard>
                      <TopBar />
                      <div className="flex-1 overflow-y-auto">
                        <PrintLabel />
                      </div>
                      <BottomNavigation />
                    </SubscriptionGuard>
                  </ProtectedRoute>
                } />
                
                <Route path="/quality" element={
                  <ProtectedRoute>
                    <SubscriptionGuard>
                      <TopBar />
                      <div className="flex-1 overflow-y-auto">
                        <QualityCheck />
                      </div>
                      <BottomNavigation />
                    </SubscriptionGuard>
                  </ProtectedRoute>
                } />
                
                <Route path="/sync" element={
                  <ProtectedRoute>
                    <SubscriptionGuard>
                      <TopBar />
                      <div className="flex-1 overflow-y-auto">
                        <Sync />
                      </div>
                      <BottomNavigation />
                    </SubscriptionGuard>
                  </ProtectedRoute>
                } />
                
                <Route path="*" element={
                  <ProtectedRoute>
                    <SubscriptionGuard>
                      <TopBar />
                      <div className="flex-1 overflow-y-auto">
                        <NotFound />
                      </div>
                      <BottomNavigation />
                    </SubscriptionGuard>
                  </ProtectedRoute>
                } />
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
