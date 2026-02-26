import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import SplashScreen from "@/pages/SplashScreen";
import HomeDashboard from "@/pages/HomeDashboard";
import BarberProfile from "@/pages/BarberProfile";
import BookingFlow from "@/pages/BookingFlow";
import ServicesScreen from "@/pages/ServicesScreen";
import GalleryScreen from "@/pages/GalleryScreen";
import ReviewsScreen from "@/pages/ReviewsScreen";
import ProfileScreen from "@/pages/ProfileScreen";
import ContactScreen from "@/pages/ContactScreen";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/home" element={<HomeDashboard />} />
          <Route path="/barber/:id" element={<BarberProfile />} />
          <Route path="/book" element={<BookingFlow />} />
          <Route path="/services" element={<ServicesScreen />} />
          <Route path="/gallery" element={<GalleryScreen />} />
          <Route path="/reviews" element={<ReviewsScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/contact" element={<ContactScreen />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
