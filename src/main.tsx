import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// Self-hosted fonts (GDPR: no request to Google CDN)
import "@fontsource/bebas-neue/400.css";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
