import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import BottomNav from "@/components/BottomNav";
import { LocalNotifications } from "@capacitor/local-notifications";
import SplashScreen from "@/pages/SplashScreen";
import HomeDashboard from "@/pages/HomeDashboard";
import BarberProfile from "@/pages/BarberProfile";
import BookingFlow from "@/pages/BookingFlow";
import StripeReturn from "@/pages/StripeReturn";
import ServicesScreen from "@/pages/ServicesScreen";
import GalleryScreen from "@/pages/GalleryScreen";
import ReviewsScreen from "@/pages/ReviewsScreen";
import ProfileScreen from "@/pages/ProfileScreen";
import ContactScreen from "@/pages/ContactScreen";
import AuthScreen from "@/pages/AuthScreen";
import ResetPassword from "@/pages/ResetPassword";
import AdminDashboard from "@/pages/AdminDashboard";
import ExploreBarbers from "@/pages/ExploreBarbers";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

// Request notification permission on app start
async function requestNotificationPermission() {
  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== "granted") {
      await LocalNotifications.requestPermissions();
    }
  } catch {
    // Not on native device — silently ignore in browser
  }
}

const App = () => {
  useEffect(() => { requestNotificationPermission(); }, []);
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/home" element={<HomeDashboard />} />
            <Route path="/barber/:id" element={<BarberProfile />} />
            <Route path="/book" element={<BookingFlow />} />
            <Route path="/stripe-return" element={<StripeReturn />} />
            <Route path="/services" element={<ServicesScreen />} />
            <Route path="/gallery" element={<GalleryScreen />} />
            <Route path="/reviews" element={<ReviewsScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/contact" element={<ContactScreen />} />
            <Route path="/auth" element={<AuthScreen />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/explore" element={<ExploreBarbers />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </BrowserRouter>
      </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
