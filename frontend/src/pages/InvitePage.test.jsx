import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { i18next, t } from "@chowgo/shared/i18n";
import { formatPrice } from "@chowgo/shared/format";

import { REFERRAL_STORAGE_KEY } from "@/lib/referralStorage";
import { useAuthStore } from "@/store/useAuthStore";
import InvitePage from "./InvitePage";

function renderAt(path) {
  render(
    <I18nextProvider i18n={i18next}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/invite/:code" element={<InvitePage />} />
          <Route path="/" element={<p>home</p>} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

beforeEach(() => {
  useAuthStore.setState({ authUser: null });
});

describe("InvitePage", () => {
  it("stores a valid code and tells a signed-out visitor it will be applied", () => {
    renderAt("/invite/k7pq-2m9x");

    expect(window.localStorage.getItem(REFERRAL_STORAGE_KEY)).toBe("K7PQ2M9X");
    expect(screen.getByText(t("profile:referral.landingTitle"))).toBeInTheDocument();
    expect(screen.getByText(t("profile:referral.pending"))).toBeInTheDocument();
    expect(
      screen.getByText(
        t("profile:referral.landingBody", {
          amount: formatPrice(300, { currency: "RSD" }),
          min: formatPrice(1000, { currency: "RSD" }),
        }).replace(/\s+/g, " "),
      ),
    ).toBeInTheDocument();
  });

  it("ignores a malformed code", () => {
    renderAt("/invite/nope");

    expect(window.localStorage.getItem(REFERRAL_STORAGE_KEY)).toBeNull();
    expect(screen.getByRole("alert")).toHaveTextContent(t("errors:referral.invalidCode"));
  });
});
