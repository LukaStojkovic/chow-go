import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { t } from "@chowgo/shared/i18n";

import { getClosures, saveClosures } from "@/services/apiSellerReports";
import { useAuthStore } from "@/store/useAuthStore";
import { axiosError, renderWithProviders } from "@/test/utils";
import { ClosuresCard } from "./ClosuresCard";

vi.mock("@/services/apiSellerReports", () => ({ getClosures: vi.fn(), saveClosures: vi.fn() }));

const today = "2026-10-13";
const xmas = { from: "2026-12-24", to: "2026-12-26", reason: "Christmas" };

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ authUser: { role: "seller", restaurant: [{ _id: "r1", timezone: "Europe/Belgrade" }] } });
  getClosures.mockResolvedValue({ closures: [xmas], timeZone: "Europe/Belgrade", today });
  saveClosures.mockImplementation(async (closures) => ({ closures, timeZone: "Europe/Belgrade", today, isOpenNow: true }));
});

const fill = (from, to, reason = "") => {
  fireEvent.change(screen.getByLabelText(t("seller:closures.from")), { target: { value: from } });
  fireEvent.change(screen.getByLabelText(t("seller:closures.to")), { target: { value: to } });
  if (reason) fireEvent.change(screen.getByLabelText(t("seller:closures.reason")), { target: { value: reason } });
};

describe("ClosuresCard", () => {
  it("adds a closure by putting the whole list", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ClosuresCard />);
    await screen.findByText("Christmas");

    fill("2026-11-01", "2026-11-03", "Renovation");
    await user.click(screen.getByRole("button", { name: t("seller:closures.add") }));

    await waitFor(() => expect(saveClosures).toHaveBeenCalled());
    expect(saveClosures.mock.calls[0][0]).toEqual([{ from: "2026-11-01", to: "2026-11-03", reason: "Renovation" }, xmas]);
    expect(await screen.findByText("Renovation")).toBeInTheDocument();
  });

  it("refuses a closure longer than the limit without saving", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ClosuresCard />);
    await screen.findByText("Christmas");

    fill("2026-11-01", "2027-02-01");
    await user.click(screen.getByRole("button", { name: t("seller:closures.add") }));

    expect(screen.getByRole("alert")).toHaveTextContent(t("errors:closure.tooLong", { max: 60 }));
    expect(saveClosures).not.toHaveBeenCalled();
  });

  it("removes a closure", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ClosuresCard />);
    await screen.findByText("Christmas");

    await user.click(screen.getByRole("button", { name: /Christmas|Dec/ }));
    await waitFor(() => expect(saveClosures).toHaveBeenCalled());
    expect(saveClosures.mock.calls[0][0]).toEqual([]);
  });

  it("shows a server refusal on the entry it is about", async () => {
    const user = userEvent.setup();
    saveClosures.mockRejectedValue(axiosError(400, { code: "CLOSURE_TOO_FAR", message: "Too far ahead", details: { index: 1 } }));
    renderWithProviders(<ClosuresCard />);
    await screen.findByText("Christmas");

    fill("2026-11-01", "2026-11-02");
    await user.click(screen.getByRole("button", { name: t("seller:closures.add") }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Too far ahead");
    expect(alert.closest("li")).not.toBeNull();
  });

  it("says when the restaurant is closed today", async () => {
    getClosures.mockResolvedValue({ closures: [{ from: "2026-10-12", to: "2026-10-14", reason: "" }], today });
    renderWithProviders(<ClosuresCard />);
    expect(await screen.findByText(t("seller:closures.closedToday"))).toBeInTheDocument();
  });
});
