import { MessageCircle } from "lucide-react";

const FloatingButtons = () => {
  const whatsappUrl = `https://wa.me/4312345678?text=${encodeURIComponent("Hi, I'd like to book an appointment at The Sharp Cut")}`;

  return (
    <>
      {/* Mobile Book Now button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-3 bg-background/90 backdrop-blur-md border-t border-border">
        <a
          href="#booking"
          className="block text-center gradient-copper text-primary-foreground font-heading text-lg tracking-widest py-3 rounded-sm"
        >
          BOOK NOW
        </a>
      </div>

      {/* WhatsApp button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 md:bottom-6 right-4 z-50 w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="text-primary-foreground" size={24} />
      </a>
    </>
  );
};

export default FloatingButtons;
