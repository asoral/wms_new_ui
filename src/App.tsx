
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import ItemEnquiry from "./pages/ItemEnquiry";
import BinEnquiry from "./pages/BinEnquiry";
import StockCount from "./pages/StockCount";
import Receive from "./pages/Receive";
import Deliver from "./pages/Deliver";
import PickList from "./pages/PickList";
import Packing from "./pages/Packing";
import QualityCheck from "./pages/QualityCheck";
import StockEntry from "./pages/StockEntry";
import MaterialRequest from "./pages/MaterialRequest";
import PrintLabel from "./pages/PrintLabel";
import Pallet from "./pages/Pallet";
import Sync from "./pages/Sync";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/home" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/item-enquiry" element={
              <ProtectedRoute>
                <ItemEnquiry />
              </ProtectedRoute>
            } />
            <Route path="/bin-enquiry" element={
              <ProtectedRoute>
                <BinEnquiry />
              </ProtectedRoute>
            } />
            <Route path="/stock-count" element={
              <ProtectedRoute>
                <StockCount />
              </ProtectedRoute>
            } />
            <Route path="/receive" element={
              <ProtectedRoute>
                <Receive />
              </ProtectedRoute>
            } />
            <Route path="/deliver" element={
              <ProtectedRoute>
                <Deliver />
              </ProtectedRoute>
            } />
            <Route path="/pick-list" element={
              <ProtectedRoute>
                <PickList />
              </ProtectedRoute>
            } />
            <Route path="/packing" element={
              <ProtectedRoute>
                <Packing />
              </ProtectedRoute>
            } />
            <Route path="/quality-check" element={
              <ProtectedRoute>
                <QualityCheck />
              </ProtectedRoute>
            } />
            <Route path="/stock-entry" element={
              <ProtectedRoute>
                <StockEntry />
              </ProtectedRoute>
            } />
            <Route path="/material-request" element={
              <ProtectedRoute>
                <MaterialRequest />
              </ProtectedRoute>
            } />
            <Route path="/print-label" element={
              <ProtectedRoute>
                <PrintLabel />
              </ProtectedRoute>
            } />
            <Route path="/pallet" element={
              <ProtectedRoute>
                <Pallet />
              </ProtectedRoute>
            } />
            <Route path="/sync" element={
              <ProtectedRoute>
                <Sync />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
