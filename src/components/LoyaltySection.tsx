import { useState } from "react";
import { Gift } from "lucide-react";

const LoyaltySection = () => {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const stamps = 4; // Demo: 4 out of 10

  return (
    <section className="py-20 md:py-32 bg-surface">
      <div className="container max-w-3xl text-center">
        <Gift className="text-copper mx-auto mb-6" size={40} />
        <h2 className="text-4xl md:text-6xl font-heading text-copper mb-4">Loyalty Rewards</h2>
        <p className="text-muted-foreground mb-10 max-w-md mx-auto">
          Every 10th haircut is <span className="text-copper font-semibold">FREE</span>. Join the program and start collecting.
        </p>

        {/* Stamp Card */}
        <div className="bg-card border border-copper/30 rounded-lg p-6 md:p-8 mb-10 max-w-md mx-auto">
          <p className="font-heading text-lg text-foreground mb-4">YOUR STAMP CARD</p>
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`aspect-square rounded-full border-2 flex items-center justify-center text-sm font-heading ${
                  i < stamps
                    ? "border-copper bg-copper text-primary-foreground"
                    : i === 9
                    ? "border-copper text-copper"
                    : "border-border text-muted-foreground"
                }`}
              >
                {i === 9 ? "FREE" : i + 1}
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-xs mt-4">{stamps}/10 — {10 - stamps} more to go!</p>
        </div>

        {/* Email CTA */}
        {joined ? (
          <p className="text-copper font-heading text-xl">Welcome to the club! ✂️</p>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); setJoined(true); }}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 bg-secondary border border-border rounded-sm px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-copper transition-colors"
            />
            <button
              type="submit"
              className="gradient-copper text-primary-foreground font-heading tracking-widest text-sm px-6 py-3 rounded-sm hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              JOIN NOW
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

export default LoyaltySection;
