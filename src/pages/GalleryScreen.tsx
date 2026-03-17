import { useState } from "react";
import { ArrowLeft, Bookmark, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import fade1 from "@/assets/fade-1.jpg";
import fade2 from "@/assets/fade-2.jpg";
import fade3 from "@/assets/fade-3.jpg";
import fade4 from "@/assets/fade-4.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import gallery5 from "@/assets/gallery-5.jpg";
import gallery6 from "@/assets/gallery-6.jpg";
import woman1 from "@/assets/woman-1.jpg";
import woman2 from "@/assets/woman-2.jpg";
import woman3 from "@/assets/woman-3.jpg";
import woman4 from "@/assets/woman-4.jpg";
import woman5 from "@/assets/woman-5.jpg";
import woman6 from "@/assets/woman-6.jpg";
import design1 from "@/assets/design-1.jpg";
import design2 from "@/assets/design-2.jpg";
import design3 from "@/assets/design-3.jpg";
import design4 from "@/assets/design-4.jpg";

// tagIndex maps to filters array: 1=Fades, 2=Beards, 3=Classic, 4=Women, 5=Design
const galleryImages = [
  { src: fade1, tagIndex: 1, saved: false },
  { src: fade2, tagIndex: 1, saved: false },
  { src: fade3, tagIndex: 1, saved: false },
  { src: fade4, tagIndex: 1, saved: true },
  { src: gallery3, tagIndex: 2, saved: false },
  { src: gallery4, tagIndex: 2, saved: true },
  { src: gallery5, tagIndex: 3, saved: false },
  { src: gallery6, tagIndex: 3, saved: false },
  { src: woman1, tagIndex: 4, saved: false },
  { src: woman2, tagIndex: 4, saved: false },
  { src: woman3, tagIndex: 4, saved: true },
  { src: woman4, tagIndex: 4, saved: false },
  { src: woman5, tagIndex: 4, saved: false },
  { src: woman6, tagIndex: 4, saved: true },
  { src: design1, tagIndex: 5, saved: false },
  { src: design2, tagIndex: 5, saved: false },
  { src: design3, tagIndex: 5, saved: true },
  { src: design4, tagIndex: 5, saved: false },
];

const GalleryScreen = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState(0);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const filters = t.gallery.filters; // ["All/Alle", "Fades", "Beards/Bärte", "Classic/Klassisch"]

  const filtered = activeFilter === 0
    ? galleryImages
    : galleryImages.filter(img => img.tagIndex === activeFilter);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="font-heading text-2xl text-foreground">{t.gallery.title}</h1>
      </div>

      {/* Filters — only show categories we have photos for */}
      <div className="px-5 mb-5">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {filters.map((f, i) => (
            <button
              key={f}
              onClick={() => setActiveFilter(i)}
              className={`px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition-all ${
                activeFilter === i
                  ? "gradient-copper text-primary-foreground"
                  : "bg-surface border border-border text-muted-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Masonry grid */}
      <div className="px-5 columns-2 gap-3 space-y-3">
        {filtered.map((img, i) => (
          <div
            key={img.src}
            className="relative rounded-2xl overflow-hidden cursor-pointer break-inside-avoid group"
            onClick={() => setLightbox(img.src)}
          >
            <img
              src={img.src}
              alt={filters[img.tagIndex]}
              className={`w-full object-cover ${i % 3 === 0 ? "h-56" : "h-44"}`}
              loading="lazy"
            />
            <div className="absolute top-2.5 right-2.5">
              <Bookmark size={18} className={img.saved ? "text-copper fill-copper" : "text-foreground/70"} />
            </div>
            <div className="absolute bottom-2.5 left-2.5">
              <span className="bg-background/70 backdrop-blur-sm text-foreground text-[10px] font-medium px-2 py-1 rounded-full">
                {filters[img.tagIndex]}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-background/95 flex items-center justify-center animate-fade-in"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-12 right-5 w-10 h-10 rounded-full bg-surface flex items-center justify-center">
            <X size={20} className="text-foreground" />
          </button>
          <img src={lightbox} alt="" className="max-w-full max-h-[80vh] rounded-2xl object-contain" />
        </div>
      )}
    </div>
  );
};

export default GalleryScreen;
