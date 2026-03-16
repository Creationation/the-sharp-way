import { ArrowLeft, MapPin, Phone, Clock, MessageCircle, Navigation, Instagram } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const hoursData = [
  { time: "Closed" },
  { time: "10:00 – 20:00" },
  { time: "10:00 – 20:00" },
  { time: "10:00 – 20:00" },
  { time: "10:00 – 20:00" },
  { time: "10:00 – 20:00" },
  { time: "Closed" },
];

const ContactScreen = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const whatsappUrl = `https://wa.me/436644686073?text=${encodeURIComponent("Hallo, ich möchte einen Termin bei Sitdown Barber vereinbaren.")}`;

  const hours = hoursData.map((h, i) => ({
    day: t.contact.days[i],
    time: h.time === "Closed" ? t.contact.closed : h.time,
    isClosed: h.time === "Closed",
  }));

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="font-heading text-2xl text-foreground">{t.contact.title}</h1>
      </div>

      {/* Map placeholder */}
      <div className="px-5 mb-5">
        <div className="card-app overflow-hidden">
          <div className="h-48 bg-surface flex items-center justify-center">
            <div className="text-center">
              <MapPin size={32} className="text-copper mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Lavaterstrasse 2</p>
              <p className="text-muted-foreground text-xs">1220 Wien, Austria</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact info */}
      <div className="px-5 space-y-2 mb-5">
        {[
          { icon: MapPin, label: "Lavaterstrasse 2, 1220 Wien", sub: "Austria", href: "https://maps.google.com/?q=Lavaterstrasse+2,+1220+Wien" },
          { icon: Phone, label: "+43 664 4686073", sub: t.contact.callUs, href: "tel:+436644686073" },
          { icon: MessageCircle, label: "WhatsApp", sub: t.contact.chatUs, href: whatsappUrl },
        ].map((item, i) => (
          <a
            key={i}
            href={item.href}
            target={item.href.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            className="card-app p-4 flex items-center gap-4 block"
          >
            <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center">
              <item.icon size={18} className="text-copper" />
            </div>
            <div>
              <p className="text-foreground text-sm font-medium">{item.label}</p>
              <p className="text-muted-foreground text-xs">{item.sub}</p>
            </div>
          </a>
        ))}
      </div>

      {/* Hours */}
      <div className="px-5 mb-5">
        <div className="card-app p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-mint animate-pulse-dot" />
            <span className="text-mint text-xs font-medium">{t.contact.openNow}</span>
            <span className="text-muted-foreground text-xs">{t.contact.closesAt}</span>
          </div>
          <div className="space-y-2">
            {hours.map(h => (
              <div key={h.day} className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">{h.day}</span>
                <span className={`text-sm ${h.isClosed ? "text-muted-foreground/50" : "text-foreground"}`}>
                  {h.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Get Directions */}
      <div className="px-5 mb-5">
        <a
          href="https://maps.google.com/?q=Lavaterstrasse+2,+1220+Wien"
          target="_blank"
          rel="noreferrer"
          className="w-full gradient-copper text-primary-foreground font-semibold py-3.5 rounded-full shadow-copper flex items-center justify-center gap-2"
        >
          <Navigation size={18} />
          {t.contact.directions}
        </a>
      </div>

      {/* Social */}
      <div className="px-5 mb-5">
        <div className="flex items-center justify-center gap-4">
          <a href="https://instagram.com/sitdownvienna" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-muted-foreground hover:text-copper transition-colors" aria-label="Instagram">
            <Instagram size={20} />
          </a>
          <a href="#" className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-muted-foreground hover:text-copper transition-colors" aria-label="TikTok">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.92 2.92 0 0 1 .88.13v-3.5a6.37 6.37 0 0 0-.88-.07 6.37 6.37 0 0 0 0 12.74 6.37 6.37 0 0 0 6.38-6.38V8.72a8.19 8.19 0 0 0 3.72.89V6.69Z"/></svg>
          </a>
          <a href="#" className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-muted-foreground hover:text-copper transition-colors" aria-label="Facebook">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 text-center">
        <p className="font-heading text-lg text-foreground tracking-widest">
          THE SHARP <span className="text-copper">CUT</span>
        </p>
        <p className="text-muted-foreground text-xs mt-1">{t.contact.copyright}</p>
      </div>
    </div>
  );
};

export default ContactScreen;
