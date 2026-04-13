import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const navItems = [
  { label: "Services", href: "#services" },
  { label: "Team", href: "#team" },
  { label: "Gallery", href: "#gallery" },
  { label: "Book", href: "#booking" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/95 backdrop-blur-md shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="container flex items-center justify-between h-16 md:h-20">
        <a href="#" className="flex items-center">
          <img src="/sitdown-logo.png" alt="Sitdown Wien" className="h-14 md:h-16" />
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="font-heading text-sm tracking-widest text-muted-foreground hover:text-copper transition-colors"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#booking"
            className="gradient-copper text-primary-foreground font-heading tracking-widest text-sm px-6 py-2 rounded-sm hover:opacity-90 transition-opacity"
          >
            BOOK NOW
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-background/98 backdrop-blur-md border-t border-border animate-slide-down">
          <div className="container py-6 flex flex-col gap-4">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="font-heading text-lg tracking-widest text-muted-foreground hover:text-copper transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a
              href="#booking"
              className="gradient-copper text-primary-foreground font-heading tracking-widest text-center py-3 rounded-sm mt-2"
              onClick={() => setMenuOpen(false)}
            >
              BOOK NOW
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
