import { useState } from "react";
import { Calendar } from "lucide-react";

const barbers = ["Ibo", "Ahmed"];
const services = [
  "Classic Haircut (€25)",
  "Fade & Taper (€30)",
  "Beard Trim (€15)",
  "Haircut + Beard Combo (€40)",
  "Hot Towel Shave (€35)",
  "Kids Cut (€18)",
];

const timeSlots: string[] = [];
for (let h = 10; h <= 19; h++) {
  timeSlots.push(`${h.toString().padStart(2, "0")}:00`);
  if (h < 20) timeSlots.push(`${h.toString().padStart(2, "0")}:30`);
}

const BookingSection = () => {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", barber: "", service: "", date: "", time: "", notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section id="booking" className="py-20 md:py-32 bg-surface">
        <div className="container max-w-2xl text-center">
          <div className="bg-card border border-copper/30 rounded-lg p-12">
            <Calendar className="text-copper mx-auto mb-6" size={48} />
            <h2 className="text-4xl md:text-5xl font-heading text-copper mb-4">You're Booked</h2>
            <p className="text-muted-foreground text-lg">We'll see you soon.</p>
            <button
              onClick={() => { setSubmitted(false); setForm({ name: "", phone: "", email: "", barber: "", service: "", date: "", time: "", notes: "" }); }}
              className="mt-8 border border-copper text-copper font-heading tracking-widest text-sm px-6 py-2 rounded-sm hover:bg-copper hover:text-primary-foreground transition-all"
            >
              BOOK ANOTHER
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="booking" className="py-20 md:py-32 bg-surface">
      <div className="container max-w-2xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-heading text-copper mb-4">Book Your Cut</h2>
          <p className="text-muted-foreground">Pick your barber, choose your style, lock in your time.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 md:p-10 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <input name="name" value={form.name} onChange={handleChange} required placeholder="Full Name" className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-copper transition-colors" />
            <input name="phone" value={form.phone} onChange={handleChange} required placeholder="Phone" type="tel" className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-copper transition-colors" />
          </div>
          <input name="email" value={form.email} onChange={handleChange} required placeholder="Email" type="email" className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-copper transition-colors" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <select name="barber" value={form.barber} onChange={handleChange} required className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-foreground focus:outline-none focus:border-copper transition-colors appearance-none">
              <option value="" disabled>Select Barber</option>
              {barbers.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select name="service" value={form.service} onChange={handleChange} required className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-foreground focus:outline-none focus:border-copper transition-colors appearance-none">
              <option value="" disabled>Select Service</option>
              {services.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <input name="date" value={form.date} onChange={handleChange} required type="date" className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-foreground focus:outline-none focus:border-copper transition-colors" />
            <select name="time" value={form.time} onChange={handleChange} required className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-foreground focus:outline-none focus:border-copper transition-colors appearance-none">
              <option value="" disabled>Select Time</option>
              {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Additional notes (optional)" rows={3} className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-copper transition-colors resize-none" />

          <button type="submit" className="w-full gradient-copper text-primary-foreground font-heading text-xl tracking-widest py-4 rounded-sm shadow-copper hover:opacity-90 transition-opacity">
            CONFIRM APPOINTMENT
          </button>
        </form>
      </div>
    </section>
  );
};

export default BookingSection;
