import { MapPin, Phone, Mail, Clock, Instagram } from "lucide-react";

const ContactFooter = () => {
  return (
    <section id="contact" className="py-20 md:py-32 bg-surface">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-heading text-copper mb-4">Find Us</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto mb-16">
          {/* Info */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <MapPin className="text-copper mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="text-foreground font-semibold">Address</p>
                <p className="text-muted-foreground">Lavaterstraße 2, 1220 Wien</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="text-copper mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="text-foreground font-semibold">Phone</p>
                <p className="text-muted-foreground">+43 1 234 5678</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Mail className="text-copper mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="text-foreground font-semibold">Email</p>
                <p className="text-muted-foreground">hello@sitdown.wien</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Clock className="text-copper mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="text-foreground font-semibold">Opening Hours</p>
                <p className="text-muted-foreground">Tuesday – Saturday: 10:00 AM – 8:00 PM</p>
                <p className="text-muted-foreground">Sunday – Monday: Closed</p>
              </div>
            </div>
          </div>

          {/* Map placeholder */}
          <div className="bg-card border border-border rounded-lg overflow-hidden aspect-[4/3] flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MapPin className="mx-auto mb-2 text-copper" size={32} />
              <p className="font-heading text-lg">Google Maps</p>
              <p className="text-sm">Lavaterstraße 2, 1220 Wien</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <img src="/sitdown-logo.png" alt="Sitdown Wien" className="h-14" />
          <div className="flex items-center gap-4">
            <a href="#" aria-label="Instagram" className="text-muted-foreground hover:text-copper transition-colors">
              <Instagram size={20} />
            </a>
            <a href="#" aria-label="Facebook" className="text-muted-foreground hover:text-copper transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="#" aria-label="TikTok" className="text-muted-foreground hover:text-copper transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.92 2.92 0 0 1 .88.13v-3.5a6.37 6.37 0 0 0-.88-.07 6.37 6.37 0 0 0 0 12.74 6.37 6.37 0 0 0 6.38-6.38V8.72a8.19 8.19 0 0 0 3.72.89V6.69Z"/></svg>
            </a>
          </div>
          <p className="text-muted-foreground text-sm">© 2025 Sitdown Wien. All rights reserved.</p>
        </div>
      </footer>
    </section>
  );
};

export default ContactFooter;
