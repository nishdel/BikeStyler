import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./mobile.css";
const viewport = window.visualViewport;
function visibleHeight() {
  document.documentElement.style.setProperty("--visible-height", `${viewport?.height || window.innerHeight}px`);
}
viewport?.addEventListener("resize", visibleHeight);
visibleHeight();
createRoot(document.getElementById("root")!).render(<App />);
