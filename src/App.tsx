import { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/auth/AuthContext";
import { SubscriptionProvider } from "@/components/subscription/SubscriptionContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SubscriptionGuard from "@/components/subscription/SubscriptionGuard";
import BottomNavigation from "@/components/BottomNavigation";
import WMSNavigation from "@/components/WMSNavigation";
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

// Loading component for individual pages
const PageLoader = () => (
  <div className="flex items-center justify-center h-full py-20">
    <LoadingSpinner size={48} />
  </div>
);

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen">
    {/* Desktop/Web Navigation - Always visible */}
    <div className="hidden md:block">
      <WMSNavigation />
    </div>
    
    {/* Main Content Area */}
    <div className="flex flex-col flex-1 h-screen overflow-hidden">
      <TopBar />
      <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </div>
      {/* Mobile Navigation - Hidden on desktop */}
      <div className="md:hidden">
        <BottomNavigation />
      </div>
    </div>
  </div>
);

const App = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Router>
        <AuthProvider>
          <SubscriptionProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<AuthForm />} />
              <Route path="/subscription-success" element={<SubscriptionSuccess />} />
              <Route path="/" element={<Navigate to="/home" replace />} />

              {/* Protected routes that require authentication and subscription */}
              <Route path="/home" element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <AppLayout>
                      <Home />
                    </AppLayout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              } />
              
              <Route path="/receive" element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <AppLayout>
                      <Receive />
                    </AppLayout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              } />
              
              <Route path="/pick-list" element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <AppLayout>
                      <PickList />
                    </AppLayout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              } />
              
              <Route path="/stock-entry" element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <AppLayout>
                      <StockEntry />
                    </AppLayout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              } />
              
              <Route path="/material-request" element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <AppLayout>
                      <MaterialRequest />
                    </AppLayout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              } />
              
              <Route path="/packing" element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <AppLayout>
                      <Packing />
                    </AppLayout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              } />
              
              <Route path="/deliver" element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <AppLayout>
                      <Deliver />
                    </AppLayout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              } />
              
              <Route path="/item-enquiry" element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <AppLayout>
                      <ItemEnquiry />
                    </AppLayout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              } />
              
              <Route path="/bin-enquiry" element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <AppLayout>
                      <BinEnquiry />
                    </AppLayout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              } />
              
              <Route path="/stock-count" element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <AppLayout>
                      <StockCount />
                    </AppLayout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              } />
              
              <Route path="/pallet" element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <AppLayout>
                      <Pallet />
                    </AppLayout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <AppLayout>
                      <Profile />
                    </AppLayout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              } />
              
              <Route path="/reports" element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <AppLayout>
                      <Reports />
                    </AppLayout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              } />
              
              <Route path="/print-label" element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <AppLayout>
                      <PrintLabel />
                    </AppLayout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              } />
              
              <Route path="/quality" element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <AppLayout>
                      <QualityCheck />
                    </AppLayout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              } />
              
              <Route path="/sync" element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <AppLayout>
                      <Sync />
                    </AppLayout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              } />
              
              <Route path="*" element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <AppLayout>
                      <NotFound />
                    </AppLayout>
                  </SubscriptionGuard>
                </ProtectedRoute>
              } />
            </Routes>
            <Toaster />
          </SubscriptionProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
