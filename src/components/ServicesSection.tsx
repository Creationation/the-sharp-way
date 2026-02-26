import { Clock, Scissors } from "lucide-react";

const services = [
  { name: "Classic Haircut", price: "€25", duration: "30min", desc: "Timeless precision cut tailored to your style." },
  { name: "Fade & Taper", price: "€30", duration: "45min", desc: "Seamless blends and razor-sharp lines." },
  { name: "Beard Trim", price: "€15", duration: "20min", desc: "Sculpted and shaped to perfection." },
  { name: "Haircut + Beard Combo", price: "€40", duration: "60min", desc: "The full experience — cut, trim, and styled." },
  { name: "Hot Towel Shave", price: "€35", duration: "45min", desc: "Old-school luxury with a straight razor finish." },
  { name: "Kids Cut", price: "€18", duration: "25min", desc: "Patient, fun, and stylish cuts for the little ones." },
];

const ServicesSection = () => {
  return (
    <section id="services" className="py-20 md:py-32 bg-background">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-heading text-copper mb-4">Our Services</h2>
          <p className="text-muted-foreground max-w-md mx-auto">Crafted with precision. Every cut tells a story.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.name}
              className="group bg-card border border-border hover:border-copper/50 rounded-lg p-6 transition-all duration-300 hover:glow-copper"
            >
              <div className="flex items-start justify-between mb-4">
                <Scissors className="text-copper" size={24} />
                <span className="font-heading text-2xl text-copper">{service.price}</span>
              </div>
              <h3 className="font-heading text-xl text-foreground mb-1">{service.name}</h3>
              <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
                <Clock size={14} />
                <span>{service.duration}</span>
              </div>
              <p className="text-muted-foreground text-sm mb-6">{service.desc}</p>
              <a
                href="#booking"
                className="block text-center gradient-copper text-primary-foreground font-heading tracking-widest text-sm py-2.5 rounded-sm hover:opacity-90 transition-opacity"
              >
                BOOK NOW
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
