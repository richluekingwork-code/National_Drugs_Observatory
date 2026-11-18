// Hide harmless THREE.Clock deprecation warning from @react-three/fiber
const _warn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === "string" && args[0].includes("THREE.Clock")) return;
  _warn(...args);
};

// ... rest of your main.jsx code (React imports, ReactDOM.render, etc.)
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
      <App />
  </StrictMode>,
);
