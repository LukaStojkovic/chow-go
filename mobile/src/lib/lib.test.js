import * as SecureStore from "expo-secure-store";

import { cn } from "./cn";
import { getInstallationId } from "./installationId";
import { isTextual } from "./isTextual";
import { clearToken, getToken, setToken } from "./secureToken";
import { homeForRole } from "@/navigation/homeForRole";

describe("cn", () => {
  it("keeps the type scale next to a text colour", () => {
    for (const size of ["display", "h1", "label-sm", "overline", "caption", "price-xl"]) {
      expect(cn(`text-${size}`, "text-foreground")).toBe(`text-${size} text-foreground`);
    }
  });

  it("lets a later size win", () => {
    expect(cn("text-caption", "text-h3")).toBe("text-h3");
  });
});

describe("isTextual", () => {
  it("accepts strings, numbers and arrays of them", () => {
    expect(isTextual("hi")).toBe(true);
    expect(isTextual(3)).toBe(true);
    expect(isTextual(["250 RSD", " earned"])).toBe(true);
    expect(isTextual([null, "x", false, 2])).toBe(true);
  });

  it("rejects elements, empty arrays and mixed content", () => {
    expect(isTextual(undefined)).toBe(false);
    expect(isTextual([])).toBe(false);
    expect(isTextual({ type: "View" })).toBe(false);
    expect(isTextual(["x", { type: "View" }])).toBe(false);
  });
});

describe("homeForRole", () => {
  it("routes each role to its own tab group", () => {
    expect(homeForRole("seller")).toBe("/(seller)");
    expect(homeForRole("courier")).toBe("/(courier)");
    expect(homeForRole("customer")).toBe("/(customer)");
    expect(homeForRole(undefined)).toBe("/(customer)");
  });
});

describe("secureToken", () => {
  it("stores, reads and clears the token", async () => {
    await expect(getToken()).resolves.toBeNull();
    await setToken("jwt-1");
    await expect(getToken()).resolves.toBe("jwt-1");
    await clearToken();
    await expect(getToken()).resolves.toBeNull();
  });

  it("reads null when the keychain throws", async () => {
    SecureStore.getItemAsync.mockRejectedValueOnce(new Error("locked"));
    await expect(getToken()).resolves.toBeNull();
  });
});

describe("getInstallationId", () => {
  it("creates one id per install and keeps it", async () => {
    const first = await getInstallationId();
    expect(first).toMatch(/^inst_[0-9a-f-]{36}$/);
    await expect(getInstallationId()).resolves.toBe(first);
  });

  it("returns undefined when the keychain is unavailable", async () => {
    SecureStore.getItemAsync.mockRejectedValueOnce(new Error("locked"));
    await expect(getInstallationId()).resolves.toBeUndefined();
  });
});
