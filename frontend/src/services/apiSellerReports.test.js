import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axiosInstance } from "@/lib/axios";
import { apiErrorMessage } from "@/lib/apiError";
import { downloadOrdersCsv, downloadPayoutCsv } from "./apiSellerReports";

vi.mock("@/lib/axios", () => ({ axiosInstance: { get: vi.fn(), put: vi.fn() } }));

describe("CSV downloads", () => {
  let clicked;

  beforeEach(() => {
    clicked = [];
    vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn(() => "blob:csv"), revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function click() {
      clicked.push({ href: this.getAttribute("href"), download: this.download });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("saves the blob under the server's filename", async () => {
    const blob = new Blob(["a,b\n"], { type: "text/csv" });
    axiosInstance.get.mockResolvedValue({ data: blob, headers: { "content-disposition": 'attachment; filename="orders_2026-09-01_2026-09-30.csv"' } });

    await downloadOrdersCsv({ from: "2026-09-01", to: "2026-09-30" });

    expect(axiosInstance.get).toHaveBeenCalledWith("/restaurant/reports/orders.csv", {
      params: { from: "2026-09-01", to: "2026-09-30" },
      responseType: "blob",
    });
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(clicked).toEqual([{ href: "blob:csv", download: "orders_2026-09-01_2026-09-30.csv" }]);
  });

  it("falls back to a filename when the header is not readable", async () => {
    axiosInstance.get.mockResolvedValue({ data: new Blob(["x"]), headers: {} });
    await downloadPayoutCsv("2026-10-05");
    expect(axiosInstance.get.mock.calls[0][0]).toBe("/restaurant/payouts/2026-10-05/orders.csv");
    expect(clicked[0].download).toBe("payout_2026-10-05.csv");
  });

  it("turns a JSON error blob back into a readable message", async () => {
    const body = new Blob([JSON.stringify({ code: "REPORT_TOO_MANY_ROWS", message: "Too many orders" })], {
      type: "application/json",
    });
    axiosInstance.get.mockRejectedValue(Object.assign(new Error("400"), { response: { status: 400, data: body } }));

    const error = await downloadOrdersCsv({ from: "2025-01-01", to: "2025-12-31" }).catch((err) => err);
    expect(apiErrorMessage(error)).toBe("Too many orders");
    expect(clicked).toEqual([]);
  });
});
