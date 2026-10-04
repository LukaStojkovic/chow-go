import { afterEach, describe, expect, it, vi } from "vitest";
import { LOCALE_HEADER, changeLanguage } from "@chowgo/shared/i18n";

import { axiosError } from "@/test/utils";
import { API_BASE_URL, axiosInstance, setUnauthorizedHandler } from "./axios";

const requestInterceptor = axiosInstance.interceptors.request.handlers[0].fulfilled;
const responseRejected = axiosInstance.interceptors.response.handlers[0].rejected;

afterEach(() => {
  setUnauthorizedHandler(null);
});

describe("axiosInstance", () => {
  it("talks to the local backend in development", () => {
    expect(API_BASE_URL).toBe("/api");
    expect(axiosInstance.defaults.withCredentials).toBe(true);
    expect(axiosInstance.defaults.timeout).toBe(15000);
  });

  it("sends the language active at request time", async () => {
    expect(requestInterceptor({ headers: {} }).headers[LOCALE_HEADER]).toBe("en");
    await changeLanguage("sr");
    expect(requestInterceptor({ headers: {} }).headers[LOCALE_HEADER]).toBe("sr");
  });

  it("calls the unauthorized handler on a 401", async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    const error = axiosError(401, {}, { config: { url: "/orders/my-orders" } });
    await expect(responseRejected(error)).rejects.toBe(error);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("ignores 401s from the session check and other statuses", async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    await expect(responseRejected(axiosError(401, {}, { config: { url: "/auth/check" } }))).rejects.toBeDefined();
    await expect(responseRejected(axiosError(403, {}, { config: { url: "/orders" } }))).rejects.toBeDefined();
    await expect(responseRejected(new Error("offline"))).rejects.toBeDefined();
    expect(handler).not.toHaveBeenCalled();
  });
});
