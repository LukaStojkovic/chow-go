import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { initMonitoring } from "@/lib/monitoring";

initMonitoring();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary
      name="root"
      title="Chow & Go could not start"
      description="Something broke while loading the app. Reloading usually fixes it."
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
