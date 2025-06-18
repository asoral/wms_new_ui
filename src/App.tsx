
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Home from "./pages/Home";
import BinEnquiry from "./pages/BinEnquiry";
import ItemEnquiry from "./pages/ItemEnquiry";
import StockCount from "./pages/StockCount";
import PickList from "./pages/PickList";
import Packing from "./pages/Packing";
import Deliver from "./pages/Deliver";
import Receive from "./pages/Receive";
import StockEntry from "./pages/StockEntry";
import MaterialRequest from "./pages/MaterialRequest";
import QualityCheck from "./pages/QualityCheck";
import PrintLabel from "./pages/PrintLabel";
import Pallet from "./pages/Pallet";
import Reports from "./pages/Reports";
import Sync from "./pages/Sync";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./components/auth/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { SubscriptionProvider } from "./components/subscription/SubscriptionContext";
import { SubscriptionGuard } from "./components/subscription/SubscriptionGuard";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import DraftReceipts from "./pages/DraftReceipts";
import ReceiptDetail from "./pages/ReceiptDetail";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SubscriptionProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <Index />
                </SubscriptionGuard>
              </ProtectedRoute>
            } />
            <Route path="/home" element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <Home />
                </SubscriptionGuard>
              </ProtectedRoute>
            } />
            <Route path="/bin-enquiry" element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <BinEnquiry />
                </SubscriptionGuard>
              </ProtectedRoute>
            } />
            <Route path="/item-enquiry" element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <ItemEnquiry />
                </SubscriptionGuard>
              </ProtectedRoute>
            } />
            <Route path="/stock-count" element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <StockCount />
                </SubscriptionGuard>
              </ProtectedRoute>
            } />
            <Route path="/pick-list" element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <PickList />
                </SubscriptionGuard>
              </ProtectedRoute>
            } />
            <Route path="/packing" element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <Packing />
                </SubscriptionGuard>
              </ProtectedRoute>
            } />
            <Route path="/deliver" element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <Deliver />
                </SubscriptionGuard>
              </ProtectedRoute>
            } />
            <Route path="/receive" element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <Receive />
                </SubscriptionGuard>
              </ProtectedRoute>
            } />
            <Route path="/receive/drafts" element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <DraftReceipts />
                </SubscriptionGuard>
              </ProtectedRoute>
            } />
            <Route path="/receive/receipt/:receiptName" element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <ReceiptDetail />
                </SubscriptionGuard>
              </ProtectedRoute>
            } />
            <Route path="/stock-entry" element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <StockEntry />
                </SubscriptionGuard>
              </ProtectedRoute>
            } />
            <Route path="/material-request" element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <MaterialRequest />
                </SubscriptionGuard>
              </ProtectedRoute>
            } />
            <Route path="/quality-check" element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <QualityCheck />
                </SubscriptionGuard>
              </ProtectedRoute>
            } />
            <Route path="/print-label" element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <PrintLabel />
                </SubscriptionGuard>
              </ProtectedRoute>
            } />
            <Route path="/pallet" element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <Pallet />
                </SubscriptionGuard>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <Reports />
                </SubscriptionGuard>
              </ProtectedRoute>
            } />
            <Route path="/sync" element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <Sync />
                </SubscriptionGuard>
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <Notifications />
                </SubscriptionGuard>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <SubscriptionGuard>
                  <Profile />
                </SubscriptionGuard>
              </ProtectedRoute>
            } />
            <Route path="/subscription-success" element={
              <ProtectedRoute>
                <SubscriptionSuccess />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SubscriptionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
