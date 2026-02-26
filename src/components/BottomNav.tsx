import { Home, Search, Scissors, Image, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: Search, label: "Explore", path: "/services" },
  { icon: Scissors, label: "Book", path: "/book", isCenter: true },
  { icon: Image, label: "Gallery", path: "/gallery" },
  { icon: User, label: "Profile", path: "/profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide on splash
  if (location.pathname === "/") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-safe">
      <div className="flex items-end justify-around px-2 h-16">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          const Icon = tab.icon;

          if (tab.isCenter) {
            return (
              <button
                key={tab.label}
                onClick={() => navigate(tab.path)}
                className="flex flex-col items-center -mt-5"
              >
                <div className="w-14 h-14 rounded-full gradient-copper flex items-center justify-center shadow-copper">
                  <Icon size={24} className="text-primary-foreground" />
                </div>
                <span className="text-[10px] mt-1 font-medium text-copper">{tab.label}</span>
              </button>
            );
          }

          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-1 py-2 px-3"
            >
              <Icon size={20} className={active ? "text-copper" : "text-muted-foreground"} />
              <span className={`text-[10px] font-medium ${active ? "text-copper" : "text-muted-foreground"}`}>
                {tab.label}
              </span>
              {active && <div className="w-1 h-1 rounded-full bg-copper" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
