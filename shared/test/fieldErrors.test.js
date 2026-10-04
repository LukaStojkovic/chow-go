import { describe, expect, it } from "vitest";

import { msg, translateFieldError } from "../src/i18n/fieldErrors.js";
import { t } from "../src/i18n/index.js";

describe("msg", () => {
  it("returns the bare key without params", () => {
    expect(msg("validation:auth.emailInvalid")).toBe("validation:auth.emailInvalid");
    expect(msg("validation:auth.emailInvalid", {})).toBe("validation:auth.emailInvalid");
  });

  it("appends params after the separator", () => {
    expect(msg("validation:auth.passwordMin", { count: 8 })).toBe('validation:auth.passwordMin::{"count":8}');
  });
});

describe("translateFieldError", () => {
  it("translates a key, with or without params", () => {
    expect(translateFieldError(msg("validation:courier.vehicleTypeRequired"), t)).toBe("Pick what you deliver on");
    const withCount = translateFieldError({ message: msg("validation:auth.passwordMin", { count: 8 }) }, t);
    expect(withCount).toContain("8");
    expect(withCount).not.toContain("validation:");
  });

  it("passes through zod's own messages and hand-written copy", () => {
    expect(translateFieldError("Expected string, received number", t)).toBe("Expected string, received number");
  });

  it("falls back to the raw string for an unknown key or broken params", () => {
    expect(translateFieldError("validation:nope.missing", t)).toBe("validation:nope.missing");
    expect(translateFieldError("validation:courier.vehicleTypeRequired::{oops", t)).toBe("Pick what you deliver on");
  });

  it("returns undefined when there is nothing to show", () => {
    expect(translateFieldError(undefined, t)).toBeUndefined();
    expect(translateFieldError({}, t)).toBeUndefined();
    expect(translateFieldError({ message: 42 }, t)).toBeUndefined();
  });
});
