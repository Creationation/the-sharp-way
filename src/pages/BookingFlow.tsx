import { useState } from "react";
import { ArrowLeft, Star, MapPin, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import barber1 from "@/assets/barber-1.jpg";
import barber2 from "@/assets/barber-2.jpg";
import barber3 from "@/assets/barber-3.jpg";

const barbers = [
  { id: 1, name: "Marco", rating: 4.9, image: barber1 },
  { id: 2, name: "Lukas", rating: 4.8, image: barber2 },
  { id: 3, name: "Daniel", rating: 4.7, image: barber3 },
];

const services = [
  { name: "Classic Haircut", price: "€25", duration: "30min" },
  { name: "Fade & Taper", price: "€30", duration: "45min" },
  { name: "Beard Trim", price: "€15", duration: "20min" },
  { name: "Haircut + Beard Combo", price: "€40", duration: "60min" },
  { name: "Hot Towel Shave", price: "€35", duration: "45min" },
  { name: "Kids Cut", price: "€18", duration: "25min" },
];

const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
const dates = [9, 10, 11, 12, 13, 14];

const timeSlots: string[] = [];
for (let h = 9; h <= 19; h++) {
  timeSlots.push(`${h.toString().padStart(2, "0")}:00`);
  timeSlots.push(`${h.toString().padStart(2, "0")}:30`);
}

// Simulate taken slots
const takenSlots = ["10:00", "11:30", "14:00", "15:30", "17:00"];

const BookingFlow = () => {
  const navigate = useNavigate();
  const [selectedBarber, setSelectedBarber] = useState(barbers[0]);
  const [selectedService, setSelectedService] = useState(services[0]);
  const [selectedDay, setSelectedDay] = useState(3); // THU
  const [selectedTime, setSelectedTime] = useState("12:00");
  const [confirmed, setConfirmed] = useState(false);

  if (confirmed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 pb-20">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full gradient-copper mx-auto mb-6 flex items-center justify-center animate-fade-up">
            <Check size={36} className="text-primary-foreground" />
          </div>
          <h2 className="font-heading text-4xl text-copper mb-2 animate-fade-up animation-delay-100" style={{ animationFillMode: "forwards", opacity: 0 }}>You're Booked!</h2>
          <p className="text-muted-foreground mb-2 animate-fade-up animation-delay-200" style={{ animationFillMode: "forwards", opacity: 0 }}>
            {selectedService.name} with {selectedBarber.name}
          </p>
          <p className="text-foreground font-medium mb-1 animate-fade-up animation-delay-300" style={{ animationFillMode: "forwards", opacity: 0 }}>
            {days[selectedDay]}, {dates[selectedDay]} Feb · {selectedTime}
          </p>
          <p className="text-muted-foreground text-xs mb-8 animate-fade-up animation-delay-400" style={{ animationFillMode: "forwards", opacity: 0 }}>
            Free cancellation up to 2 hours before
          </p>
          <button
            onClick={() => navigate("/home")}
            className="gradient-copper text-primary-foreground font-semibold px-8 py-3 rounded-full shadow-copper animate-fade-up animation-delay-500"
            style={{ animationFillMode: "forwards", opacity: 0 }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="font-heading text-2xl text-foreground flex-1">Book Now</h1>
        <img src={selectedBarber.image} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-copper" />
      </div>

      {/* Select Barber */}
      <div className="px-5 mb-5">
        <h3 className="font-heading text-sm text-muted-foreground mb-3 tracking-widest">SELECT BARBER</h3>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {barbers.map(b => (
            <button
              key={b.id}
              onClick={() => setSelectedBarber(b)}
              className={`flex items-center gap-3 card-app px-4 py-3 flex-shrink-0 transition-all ${selectedBarber.id === b.id ? "border-copper" : ""}`}
            >
              <img src={b.image} alt={b.name} className="w-10 h-10 rounded-full object-cover" />
              <div className="text-left">
                <p className="text-foreground text-sm font-medium">{b.name}</p>
                <div className="flex items-center gap-1">
                  <Star size={10} className="text-copper fill-copper" />
                  <span className="text-muted-foreground text-[11px]">{b.rating}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Available Slots - Day strip */}
      <div className="px-5 mb-5">
        <h3 className="font-heading text-sm text-muted-foreground mb-3 tracking-widest">AVAILABLE SLOTS</h3>
        <div className="flex gap-2 mb-4">
          {days.map((d, i) => (
            <button
              key={d}
              onClick={() => setSelectedDay(i)}
              className={`flex-1 py-3 rounded-xl text-center transition-all ${
                selectedDay === i
                  ? "gradient-copper shadow-copper"
                  : "bg-surface border border-border"
              }`}
            >
              <p className={`text-[10px] font-medium ${selectedDay === i ? "text-primary-foreground" : "text-muted-foreground"}`}>{d}</p>
              <p className={`text-lg font-semibold ${selectedDay === i ? "text-primary-foreground" : "text-foreground"}`}>{dates[i]}</p>
              <p className={`text-[10px] ${selectedDay === i ? "text-primary-foreground/70" : "text-muted-foreground"}`}>FEB</p>
            </button>
          ))}
        </div>
      </div>

      {/* Time slots */}
      <div className="px-5 mb-5">
        <h3 className="font-heading text-sm text-muted-foreground mb-3 tracking-widest">SELECT TIME</h3>
        <div className="grid grid-cols-4 gap-2">
          {timeSlots.map(t => {
            const taken = takenSlots.includes(t);
            const selected = selectedTime === t;
            return (
              <button
                key={t}
                disabled={taken}
                onClick={() => setSelectedTime(t)}
                className={`py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                  selected
                    ? "gradient-copper text-primary-foreground shadow-copper"
                    : taken
                    ? "bg-surface text-muted-foreground/40 cursor-not-allowed"
                    : "bg-surface border border-border text-foreground hover:border-copper/30"
                }`}
              >
                {t}
                {!taken && !selected && (
                  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-mint" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Service selection */}
      <div className="px-5 mb-5">
        <h3 className="font-heading text-sm text-muted-foreground mb-3 tracking-widest">SELECT SERVICE</h3>
        <div className="space-y-2">
          {services.map(s => (
            <button
              key={s.name}
              onClick={() => setSelectedService(s)}
              className={`w-full card-app p-4 flex items-center justify-between transition-all ${
                selectedService.name === s.name ? "border-copper" : ""
              }`}
            >
              <div className="text-left">
                <p className="text-foreground text-sm font-medium">{s.name}</p>
                <p className="text-muted-foreground text-xs">{s.duration}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-copper font-semibold text-sm">{s.price}</span>
                {selectedService.name === s.name && (
                  <div className="w-5 h-5 rounded-full gradient-copper flex items-center justify-center">
                    <Check size={12} className="text-primary-foreground" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="px-5 mb-6">
        <div className="card-app p-4 border-copper/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-xs">Service</span>
            <span className="text-foreground text-sm font-medium">{selectedService.name}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-xs">Duration</span>
            <span className="text-foreground text-sm">{selectedService.duration}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-xs">Barber</span>
            <span className="text-foreground text-sm">{selectedBarber.name}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-xs">Date & Time</span>
            <span className="text-foreground text-sm">{days[selectedDay]} {dates[selectedDay]} · {selectedTime}</span>
          </div>
          <div className="border-t border-border my-3" />
          <div className="flex items-center justify-between">
            <span className="text-foreground font-semibold">Total</span>
            <span className="text-copper font-heading text-2xl">{selectedService.price}</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-16 left-0 right-0 z-40 px-5 py-3 bg-background/90 backdrop-blur-md border-t border-border">
        <button
          onClick={() => setConfirmed(true)}
          className="w-full gradient-copper text-primary-foreground font-semibold text-base py-3.5 rounded-full shadow-copper"
        >
          Confirm Booking →
        </button>
        <p className="text-center text-muted-foreground text-[10px] mt-2">Free cancellation up to 2 hours before</p>
      </div>
    </div>
  );
};

export default BookingFlow;
