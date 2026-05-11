import { useState } from "react";
import { X } from "lucide-react";

const PromoBanner = () => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] gradient-copper text-primary-foreground text-center py-2 px-4 text-sm font-body">
      <span className="font-semibold">First Visit? Get 20% OFF</span> · Use code: <span className="font-heading tracking-wider">SITDOWN20</span>
      <button onClick={() => setVisible(false)} className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70" aria-label="Close">
        <X size={16} />
      </button>
    </div>
  );
};

export default PromoBanner;
