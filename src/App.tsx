
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import MyBikes from "./pages/MyBikes";
import Profile from "./pages/Profile";
import Favorites from "./pages/Favorites";
import BikeSelector from "./pages/BikeSelector";
import CustomizeBike from "./pages/CustomizeBike";
import BottomNav from "./components/BottomNav";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="relative min-h-screen">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/my-bikes" element={<MyBikes />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/bike-selector" element={<BikeSelector />} />
            <Route path="/customize/:bikeId" element={<CustomizeBike />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
