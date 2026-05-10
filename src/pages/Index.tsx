import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import TeamSection from "@/components/TeamSection";
import GallerySection from "@/components/GallerySection";
import BookingSection from "@/components/BookingSection";
import TestimonialsSection from "@/components/TestimonialsSection";

import AboutSection from "@/components/AboutSection";
import ContactFooter from "@/components/ContactFooter";
import PromoBanner from "@/components/PromoBanner";
import FloatingButtons from "@/components/FloatingButtons";
import CookieConsent from "@/components/CookieConsent";
import LoadingScreen from "@/components/LoadingScreen";

const Index = () => {
  return (
    <>
      <LoadingScreen />
      <PromoBanner />
      <Navbar />
      <main>
        <HeroSection />
        <ServicesSection />
        <TeamSection />
        <GallerySection />
        <BookingSection />
        <TestimonialsSection />
        <LoyaltySection />
        <AboutSection />
        <ContactFooter />
      </main>
      <FloatingButtons />
      <CookieConsent />
    </>
  );
};

export default Index;
