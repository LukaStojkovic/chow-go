import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { i18next } from "@chowgo/shared/i18n";
import "./index.css";

import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { initMonitoring } from "@/lib/monitoring";
import { setupI18n } from "@/lib/i18n";

initMonitoring();

// Before the first render: the error boundary below already needs translated
// copy, and starting in English and correcting on the next tick would flash.
setupI18n();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <I18nextProvider i18n={i18next}>
      <ErrorBoundary name="root" variant="startup">
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </I18nextProvider>
  </StrictMode>,
);
