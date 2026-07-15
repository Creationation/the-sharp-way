import barber1 from "@/assets/barber-1.jpg";
import barber2 from "@/assets/barber-2.jpg";

const barbers = [
  { name: "Ibo", specialty: "Classic Cuts & Hot Towel Shaves", years: 12, image: barber1 },
  { name: "Ahmed", specialty: "Fades, Tapers & Modern Styles", years: 7, image: barber2 },
];

const TeamSection = () => {
  return (
    <section id="team" className="py-20 md:py-32 bg-surface">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-heading text-copper mb-4">Meet The Team</h2>
          <p className="text-muted-foreground max-w-md mx-auto">Master barbers with decades of combined experience.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {barbers.map((barber) => (
            <div key={barber.name} className="group text-center">
              <div className="relative overflow-hidden rounded-lg mb-6 aspect-[3/4]">
                <img
                  src={barber.image}
                  alt={`${barber.name} - barber at Sitdown Wien`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="font-heading text-3xl text-foreground">{barber.name}</h3>
                  <p className="text-copper text-sm">{barber.specialty}</p>
                  <p className="text-muted-foreground text-xs mt-1">{barber.years} years experience</p>
                </div>
              </div>
              <a
                href="#booking"
                className="inline-block border border-copper text-copper font-heading tracking-widest text-sm px-6 py-2 rounded-sm hover:bg-copper hover:text-primary-foreground transition-all"
              >
                BOOK WITH {barber.name.toUpperCase()}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
