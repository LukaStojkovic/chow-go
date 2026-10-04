import { describe, expect, it } from "vitest";
import { t } from "@chowgo/shared/i18n";

import { axiosError } from "@/test/utils";
import { apiErrorFields, apiErrorMessage } from "./apiError";

describe("apiErrorMessage", () => {
  it("reports a network failure when there is no response", () => {
    expect(apiErrorMessage(new Error("Network Error"))).toBe(t("errors:byCode.NETWORK"));
  });

  it("stays silent for a cancelled request", () => {
    expect(apiErrorMessage({ code: "ERR_CANCELED" })).toBe("");
  });

  it("explains rate limiting even when the server sent a message", () => {
    expect(apiErrorMessage(axiosError(429, { message: "Too many" }))).toBe(t("errors:byCode.RATE_LIMITED"));
  });

  it("prefers the server's localised message", () => {
    expect(apiErrorMessage(axiosError(400, { message: "Adresa je predaleko", code: "X" }))).toBe(
      "Adresa je predaleko",
    );
  });

  it("translates a known code when the message is missing or blank", () => {
    expect(apiErrorMessage(axiosError(401, { message: "  ", code: "TOKEN_REVOKED" }))).toBe(
      t("errors:byCode.TOKEN_REVOKED"),
    );
  });

  it("falls back for an unknown code or an empty body", () => {
    expect(apiErrorMessage(axiosError(500, { code: "SOMETHING_NEW" }))).toBe(t("common:error.generic"));
    expect(apiErrorMessage(axiosError(502, null))).toBe(t("common:error.generic"));
    expect(apiErrorMessage(axiosError(500, {}), { fallbackKey: "order:detail.placeFailedLong" })).toBe(
      t("order:detail.placeFailedLong"),
    );
  });
});

describe("apiErrorFields", () => {
  it("returns the per-field map when present", () => {
    expect(apiErrorFields(axiosError(400, { fields: { email: "taken" } }))).toEqual({ email: "taken" });
  });

  it("returns null otherwise", () => {
    expect(apiErrorFields(axiosError(400, { fields: "nope" }))).toBeNull();
    expect(apiErrorFields(undefined)).toBeNull();
  });
});
