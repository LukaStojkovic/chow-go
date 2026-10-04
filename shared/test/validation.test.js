import { describe, expect, it } from "vitest";

import { courierApplicationSchema } from "../src/validation.js";

const FUTURE = "2099-01-01";
const PAST = "2000-01-01";

const valid = () => ({
  fullName: "Marko Petrović",
  email: "marko@example.com",
  phoneNumber: "+381601234567",
  password: "correct-horse",
  vehicleType: "scooter",
  vehicleNumber: "BG-123-AB",
  vehicleModel: "Vespa",
  documents: {
    driverLicense: { number: "L123", expiryDate: FUTURE },
    vehicleRegistration: { number: "R123", expiryDate: FUTURE },
    insurance: { number: "I123", expiryDate: "" },
  },
  paymentMethod: "cash",
});

const issues = (data) => {
  const result = courierApplicationSchema.safeParse(data);
  if (result.success) return {};
  const out = {};
  for (const i of result.error.issues) out[i.path.join(".")] ??= i.message;
  return out;
};

describe("courierApplicationSchema", () => {
  it("accepts a complete application", () => {
    expect(courierApplicationSchema.safeParse(valid()).success).toBe(true);
  });

  it("rejects short names, bad emails and malformed phone numbers", () => {
    expect(issues({ ...valid(), fullName: "Al" })).toEqual({
      fullName: 'validation:auth.fullNameMin::{"count":3}',
    });
    expect(issues({ ...valid(), email: "nope" })).toHaveProperty("email", "validation:auth.emailInvalid");
    expect(issues({ ...valid(), phoneNumber: "060-abc-12345" })).toHaveProperty(
      "phoneNumber",
      "validation:auth.phoneInvalid",
    );
  });

  it("uses translatable keys for enum errors", () => {
    expect(issues({ ...valid(), vehicleType: "plane" })).toHaveProperty(
      "vehicleType",
      "validation:courier.vehicleTypeRequired",
    );
    expect(issues({ ...valid(), paymentMethod: "card" })).toHaveProperty(
      "paymentMethod",
      "validation:courier.paymentMethodRequired",
    );
  });

  it("refuses expired documents", () => {
    const data = valid();
    data.documents.driverLicense.expiryDate = PAST;
    data.documents.insurance.expiryDate = PAST;
    expect(issues(data)).toEqual({
      "documents.driverLicense.expiryDate": "validation:courier.licenseNotExpired",
      "documents.insurance.expiryDate": "validation:courier.insuranceNotExpired",
    });
  });
});

describe("phone number length", () => {
  it("counts formatting spaces toward the 15-character limit", () => {
    expect(issues({ ...valid(), phoneNumber: "+381 60 123 4567" })).toHaveProperty("phoneNumber");
  });
});
