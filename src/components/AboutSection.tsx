import shopInterior from "@/assets/shop-interior.jpg";

const AboutSection = () => {
  return (
    <section id="about" className="py-20 md:py-32 bg-background">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Image */}
          <div className="rounded-lg overflow-hidden aspect-square">
            <img
              src={shopInterior}
              alt="The Sharp Cut barbershop interior"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Text */}
          <div>
            <h2 className="text-4xl md:text-6xl font-heading text-copper mb-6">Our Story</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The Sharp Cut was born from a simple belief: every man deserves a barbershop that respects the craft.
              Founded in 2019 in the heart of Vienna, we blend old-school tradition with modern technique.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              From straight-razor shaves to precision fades, our master barbers deliver an experience — not just a haircut.
              Walk in, sit down, and leave looking your absolute best.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: "3", label: "Master Barbers" },
                { value: "800+", label: "Happy Clients" },
                { value: "2019", label: "Est." },
              ].map((stat) => (
                <div key={stat.label} className="text-center bg-card border border-border rounded-lg p-4">
                  <div className="font-heading text-3xl text-copper">{stat.value}</div>
                  <div className="text-muted-foreground text-xs mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
