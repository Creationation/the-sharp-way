import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";

const images = [
  { src: gallery1, alt: "Before and after fade haircut" },
  { src: gallery2, alt: "Beard grooming result" },
  { src: gallery3, alt: "Taper fade side profile" },
];

const GallerySection = () => {
  return (
    <section id="gallery" className="py-20 md:py-32 bg-background">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-heading text-copper mb-4">The Art of the Cut</h2>
          <p className="text-muted-foreground max-w-md mx-auto">Real results. Real craftsmanship.</p>
        </div>
      </div>

      {/* Mobile: horizontal scroll, Desktop: grid */}
      <div className="md:hidden overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 px-6 pb-4" style={{ width: "max-content" }}>
          {images.map((img, i) => (
            <div key={i} className="w-[75vw] flex-shrink-0 rounded-lg overflow-hidden">
              <img src={img.src} alt={img.alt} className="w-full h-64 object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      </div>

      <div className="hidden md:grid grid-cols-3 gap-4 container">
        {images.map((img, i) => (
          <div key={i} className="group rounded-lg overflow-hidden aspect-[4/3]">
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default GallerySection;
