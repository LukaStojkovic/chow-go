import { describe, expect, it, vi } from "vitest";

import { priceFilterScale } from "./priceFilter";
import { prefetchRoute, routeChunks } from "./routeChunks";
import { cn } from "./utils";

describe("cn", () => {
  it("merges conditional classes and resolves Tailwind conflicts", () => {
    const isHidden = false;
    expect(cn("px-2", isHidden && "hidden", "px-4", { "text-sm": true })).toBe("px-4 text-sm");
  });

  it("treats the theme's type scale as font sizes, not colours", () => {
    for (const size of ["display", "h1", "h2", "h3", "body-lg", "body", "body-sm", "label", "caption", "price", "price-lg"]) {
      expect(cn(`text-${size}`, "text-muted-foreground")).toBe(`text-${size} text-muted-foreground`);
    }
    expect(cn("text-caption", "text-h3")).toBe("text-h3");
    expect(cn("text-sm", "text-caption")).toBe("text-caption");
  });
});

describe("priceFilterScale", () => {
  it("uses a dinar scale for RSD and a default otherwise", () => {
    expect(priceFilterScale("RSD")).toEqual({ max: 5000, step: 50 });
    expect(priceFilterScale("EUR")).toEqual({ max: 100, step: 1 });
    expect(priceFilterScale(undefined)).toEqual({ max: 100, step: 1 });
  });
});

describe("prefetchRoute", () => {
  it("warms a known chunk and swallows failures", async () => {
    const loader = vi.fn(() => Promise.reject(new Error("offline")));
    const original = routeChunks["/seller/menu"];
    routeChunks["/seller/menu"] = loader;
    try {
      expect(() => prefetchRoute("/seller/menu")).not.toThrow();
      expect(loader).toHaveBeenCalledOnce();
      await Promise.resolve();
    } finally {
      routeChunks["/seller/menu"] = original;
    }
  });

  it("ignores unknown paths", () => {
    expect(() => prefetchRoute("/nowhere")).not.toThrow();
  });
});
