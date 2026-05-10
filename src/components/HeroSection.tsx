import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt="Barber at work in premium barbershop"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-background/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 container text-center px-4">
        <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-heading leading-none mb-6 opacity-0 animate-fade-up">
          Sitdown.<br />
          Clean Lines.<br />
          <span className="text-gradient-copper">Bold Style.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 opacity-0 animate-fade-up animation-delay-200">
          Sitdown Wien · Gentlemen's Barber
        </p>
        <a
          href="#booking"
          className="inline-block gradient-copper text-primary-foreground font-heading text-xl md:text-2xl tracking-widest px-10 py-4 rounded-sm shadow-copper hover:opacity-90 transition-all opacity-0 animate-fade-up animation-delay-400"
        >
          BOOK NOW
        </a>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-0 animate-fade-up animation-delay-800">
        <span className="text-muted-foreground text-xs font-heading tracking-widest">SCROLL</span>
        <div className="w-px h-8 bg-copper/50" />
      </div>
    </section>
  );
};

export default HeroSection;
