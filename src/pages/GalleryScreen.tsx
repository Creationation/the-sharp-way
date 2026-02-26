import { useState } from "react";
import { ArrowLeft, Bookmark, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import barber1 from "@/assets/barber-1.jpg";
import barber2 from "@/assets/barber-2.jpg";
import barber3 from "@/assets/barber-3.jpg";

const filters = ["All", "Fades", "Beards", "Classic", "Color"];

const galleryImages = [
  { src: gallery1, tag: "Fade", saved: false },
  { src: gallery2, tag: "Beard", saved: true },
  { src: gallery3, tag: "Classic", saved: false },
  { src: barber1, tag: "Fade", saved: false },
  { src: barber2, tag: "Classic", saved: true },
  { src: barber3, tag: "Beard", saved: false },
];

const GalleryScreen = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("All");
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="font-heading text-2xl text-foreground">The Art of the Cut</h1>
      </div>

      {/* Filters */}
      <div className="px-5 mb-5">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition-all ${
                activeFilter === f
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
        {galleryImages.map((img, i) => (
          <div
            key={i}
            className="relative rounded-2xl overflow-hidden cursor-pointer break-inside-avoid group"
            onClick={() => setLightbox(img.src)}
          >
            <img
              src={img.src}
              alt="Haircut"
              className={`w-full object-cover ${i % 3 === 0 ? "h-56" : "h-44"}`}
              loading="lazy"
            />
            <div className="absolute top-2.5 right-2.5">
              <Bookmark size={18} className={img.saved ? "text-copper fill-copper" : "text-foreground/70"} />
            </div>
            <div className="absolute bottom-2.5 left-2.5">
              <span className="bg-background/70 backdrop-blur-sm text-foreground text-[10px] font-medium px-2 py-1 rounded-full">
                {img.tag}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-background/95 flex items-center justify-center animate-fade-in" onClick={() => setLightbox(null)}>
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
