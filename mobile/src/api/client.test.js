import { LOCALE_HEADER, changeLanguage, t } from "@chowgo/shared/i18n";

import { getToken, setToken } from "@/lib/secureToken";
import { axiosError } from "@/test/utils";
import { api, errorMessage, setUnauthorizedHandler } from "./client";

const onRequest = api.interceptors.request.handlers[0].fulfilled;
const onError = api.interceptors.response.handlers[0].rejected;

afterEach(() => setUnauthorizedHandler(null));

describe("api client", () => {
  it("identifies itself as the mobile client so login returns a token", () => {
    expect(api.defaults.headers["X-Client"]).toBe("mobile");
    expect(api.defaults.timeout).toBe(15000);
  });

  it("attaches the stored bearer token and the current language", async () => {
    await setToken("jwt-1");
    await changeLanguage("sr");
    const config = await onRequest({ headers: {} });
    expect(config.headers.Authorization).toBe("Bearer jwt-1");
    expect(config.headers[LOCALE_HEADER]).toBe("sr");
  });

  it("sends no Authorization header when signed out", async () => {
    const config = await onRequest({ headers: {} });
    expect(config.headers.Authorization).toBeUndefined();
  });

  it("drops the token and notifies on a 401", async () => {
    await setToken("jwt-1");
    const handler = jest.fn();
    setUnauthorizedHandler(handler);
    const error = axiosError(401);

    await expect(onError(error)).rejects.toBe(error);
    await expect(getToken()).resolves.toBeNull();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("keeps the token on other failures", async () => {
    await setToken("jwt-1");
    const handler = jest.fn();
    setUnauthorizedHandler(handler);
    await expect(onError(axiosError(500))).rejects.toBeDefined();
    await expect(onError(new Error("Network Error"))).rejects.toBeDefined();
    await expect(getToken()).resolves.toBe("jwt-1");
    expect(handler).not.toHaveBeenCalled();
  });
});

describe("errorMessage", () => {
  it("names a network failure and otherwise uses the fallback", () => {
    expect(errorMessage(new Error("Network Error"))).toBe(t("errors:byCode.NETWORK"));
    expect(errorMessage(new Error("timeout of 15000ms exceeded"))).toBe(t("common:error.generic"));
    expect(errorMessage(undefined, "order:detail.placeFailedLong")).toBe(t("order:detail.placeFailedLong"));
  });

  it("explains rate limiting", () => {
    expect(errorMessage(axiosError(429, { message: "slow down" }))).toBe(t("errors:byCode.RATE_LIMITED"));
  });

  it("prefers the server's localised message, then a known code", () => {
    expect(errorMessage(axiosError(400, { message: "Predaleko" }))).toBe("Predaleko");
    expect(errorMessage(axiosError(401, { code: "TOKEN_REVOKED" }))).toBe(t("errors:byCode.TOKEN_REVOKED"));
  });

  it("never shows a raw key for a code the app does not know", () => {
    expect(errorMessage(axiosError(500, { code: "SOMETHING_NEW" }))).toBe(t("common:error.generic"));
    expect(errorMessage(axiosError(502, null))).toBe(t("common:error.generic"));
  });
});
