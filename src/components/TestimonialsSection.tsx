import { Star, Quote } from "lucide-react";
import { useRef } from "react";

const reviews = [
  { name: "Alex", service: "Fade & Taper", stars: 5, text: "Best barbershop in Vienna. Ibo nailed the fade · absolutely clean." },
  { name: "Thomas", service: "Haircut + Beard Combo", stars: 5, text: "These guys know their craft. I walked in scruffy and walked out looking like a different person." },
  { name: "Stefan", service: "Hot Towel Shave", stars: 5, text: "The hot towel shave is an experience. Smooth, relaxing, and flawless." },
  { name: "Michael", service: "Classic Haircut", stars: 4, text: "Ahmed took his time to get the cut exactly right. Professional and friendly." },
];

const TestimonialsSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-heading text-copper mb-4">What Clients Say</h2>
        </div>
      </div>

      {/* Mobile: horizontal scroll, Desktop: grid */}
      <div className="md:hidden overflow-x-auto scrollbar-hide" ref={scrollRef}>
        <div className="flex gap-4 px-6 pb-4" style={{ width: "max-content" }}>
          {reviews.map((r, i) => (
            <ReviewCard key={i} review={r} />
          ))}
        </div>
      </div>

      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6 container">
        {reviews.map((r, i) => (
          <ReviewCard key={i} review={r} />
        ))}
      </div>
    </section>
  );
};

const ReviewCard = ({ review }: { review: typeof reviews[number] }) => (
  <div className="w-[80vw] md:w-auto flex-shrink-0 bg-card border border-border rounded-lg p-6 relative">
    <Quote className="text-copper/20 absolute top-4 right-4" size={32} />
    <div className="flex gap-0.5 mb-4">
      {Array.from({ length: review.stars }).map((_, i) => (
        <Star key={i} className="text-copper fill-copper" size={16} />
      ))}
    </div>
    <p className="text-foreground text-sm leading-relaxed mb-4">"{review.text}"</p>
    <div>
      <span className="font-heading text-lg text-foreground">{review.name}</span>
      <span className="text-muted-foreground text-xs ml-2">· {review.service}</span>
    </div>
  </div>
);

export default TestimonialsSection;
