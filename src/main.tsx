import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { initNativeShell } from "./lib/native";

initNativeShell();

createRoot(document.getElementById("root")!).render(<App />);
