import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force environment reload after lovable-tagger installation
createRoot(document.getElementById("root")!).render(<App />);
