import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Phone, Clock, MessageCircle, Navigation, Instagram, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ShopHour {
  weekday: number; // 0 = Monday … 6 = Sunday
  is_open: boolean;
  open_time: string;
  close_time: string;
}

const FALLBACK: ShopHour[] = Array.from({ length: 7 }, (_, weekday) => ({
  weekday,
  is_open: weekday !== 6,
  open_time: "09:00",
  close_time: "19:00",
}));

const hhmm = (v: string) => String(v).slice(0, 5);
const toMin = (v: string) => Number(v.slice(0, 2)) * 60 + Number(v.slice(3, 5));

const ContactScreen = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [shopHours, setShopHours] = useState<ShopHour[]>(FALLBACK);

  useEffect(() => {
    supabase
      .from("shop_hours")
      .select("weekday, is_open, open_time, close_time")
      .order("weekday")
      .then(({ data }) => {
        if (data && data.length) {
          const byDay = new Map<number, any>(data.map((r: any) => [r.weekday, r]));
          setShopHours(
            FALLBACK.map(d => {
              const row = byDay.get(d.weekday);
              return row
                ? { weekday: d.weekday, is_open: row.is_open, open_time: hhmm(row.open_time), close_time: hhmm(row.close_time) }
                : d;
            })
          );
        }
      });
  }, []);

  const now = new Date();
  const todayIdx = (now.getDay() + 6) % 7;
  const today = shopHours.find(h => h.weekday === todayIdx);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const open = !!today?.is_open && nowMin >= toMin(today.open_time) && nowMin < toMin(today.close_time);
  const whatsappUrl = `https://wa.me/436644686073?text=${encodeURIComponent("Hallo, ich möchte einen Termin bei Sitdown Barber vereinbaren.")}`;

  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);

  const submitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const message = form.message.trim();
    if (!name || !email || !message) {
      toast.error(t.contact.formRequired);
      return;
    }
    if (name.length > 100 || email.length > 255 || message.length > 2000) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-contact-message", {
        body: { name, email, phone: form.phone.trim(), message, lang },
      });
      if (error) throw error;
      toast.success(t.contact.formSuccess);
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch {
      toast.error(t.contact.formError);
    }
    setSending(false);
  };

  const hours = shopHours.map(h => ({
    day: t.contact.days[h.weekday],
    time: h.is_open ? `${h.open_time} – ${h.close_time}` : t.contact.closed,
    isClosed: !h.is_open,
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

      {/* Interactive Map */}
      <div className="px-5 mb-5">
        <a
          href="https://www.google.com/maps/dir/?api=1&destination=Lavaterstrasse+2,+1220+Wien,+Austria"
          target="_blank"
          rel="noreferrer"
          className="card-app overflow-hidden block"
        >
          <div className="relative h-48 w-full">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2657.5!2d16.3976!3d48.2358!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x476d07851f8daaab%3A0x0!2sLavaterstrasse%202%2C%201220%20Wien!5e0!3m2!1sde!2sat!4v1"
              width="100%"
              height="100%"
              style={{ border: 0, pointerEvents: "none" }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Shop location"
            />
            <div className="absolute inset-0" />
          </div>
        </a>
      </div>

      {/* Contact info */}
      <div className="px-5 space-y-2 mb-5">
        {[
          { icon: MapPin, label: "Lavaterstrasse 2, 1220 Wien", sub: "Austria", href: "https://www.google.com/maps/dir/?api=1&destination=Lavaterstrasse+2,+1220+Wien,+Austria" },
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
            <div className={`w-2 h-2 rounded-full ${open ? "bg-mint animate-pulse-dot" : "bg-muted-foreground"}`} />
            <span className={`text-xs font-medium ${open ? "text-mint" : "text-muted-foreground"}`}>
              {open ? t.contact.openNow : t.contact.closedNow}
            </span>
            {open && (
              <span className="text-muted-foreground text-xs">{t.contact.closesAt}</span>
            )}
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

      {/* Contact form */}
      <div className="px-5 mb-5">
        <form onSubmit={submitMessage} className="card-app p-4 space-y-3">
          <div>
            <h3 className="font-heading text-lg text-foreground">{t.contact.formTitle}</h3>
            <p className="text-muted-foreground text-xs mt-0.5">{t.contact.formSubtitle}</p>
          </div>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t.contact.formName}
            maxLength={100}
            required
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-copper"
          />
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder={t.contact.formEmail}
            maxLength={255}
            required
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-copper"
          />
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder={t.contact.formPhone}
            maxLength={40}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-copper"
          />
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder={t.contact.formMessage}
            maxLength={2000}
            rows={4}
            required
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-copper resize-none"
          />
          <button
            type="submit"
            disabled={sending}
            className="w-full gradient-copper text-primary-foreground font-semibold py-3 rounded-full shadow-copper flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Send size={16} />
            {sending ? t.contact.formSending : t.contact.formSend}
          </button>
        </form>
      </div>

      {/* Get Directions */}
      <div className="px-5 mb-5">
        <a
          href="https://www.google.com/maps/dir/?api=1&destination=Lavaterstrasse+2,+1220+Wien,+Austria"
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
        <img src="/sitdown-logo.png" alt="Sitdown Wien" className="h-12 mx-auto" />
        <p className="text-muted-foreground text-xs mt-1">{t.contact.copyright}</p>
      </div>
    </div>
  );
};

export default ContactScreen;
