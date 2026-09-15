/**
 * Field definitions for the courier application form.
 *
 * Labels and placeholders are translation keys, not copy: this module is
 * evaluated once at import time, before a language has been chosen, so a
 * resolved sentence would be frozen in whichever one loaded first. The step
 * components call `t()` on these at render.
 *
 * Placeholders that are a format example rather than words - a number plate,
 * an email shape - stay literal: they illustrate a pattern, and translating
 * "DL01AB1234" would make it less useful, not more.
 */

export const STEP_1_FIELDS = {
  fullName: {
    name: "fullName",
    label: "auth:fields.fullName",
    placeholder: "courier:signup.namePlaceholder",
    type: "text",
  },
  email: {
    name: "email",
    label: "courier:signup.emailLabel",
    placeholder: "john@example.com",
    type: "email",
  },
  phoneNumber: {
    name: "phoneNumber",
    label: "profile:account.phone",
    placeholder: "9876543210",
    type: "tel",
  },
  password: {
    name: "password",
    label: "auth:fields.password",
    placeholder: "courier:signup.passwordPlaceholder",
    type: "password",
  },
};

export const STEP_2_FIELDS = {
  vehicleType: {
    name: "vehicleType",
    label: "courier:profile.vehicleType",
    type: "select",
    // Values are the `Courier.vehicleType` enum and stay English; only the
    // label a person reads is translated.
    options: [
      { value: "bike", label: "common:taxonomy.vehicle.bike" },
      { value: "scooter", label: "common:taxonomy.vehicle.scooter" },
      { value: "motorcycle", label: "common:taxonomy.vehicle.motorcycle" },
      { value: "car", label: "common:taxonomy.vehicle.car" },
    ],
  },
  vehicleNumber: {
    name: "vehicleNumber",
    label: "courier:signup.vehicleNumber",
    placeholder: "DL01AB1234",
    type: "text",
  },
  vehicleModel: {
    name: "vehicleModel",
    label: "courier:signup.vehicleModel",
    placeholder: "Honda CB 150",
    type: "text",
  },
};

export const STEP_3_DOCUMENTS = {
  driverLicense: {
    title: "courier:signup.driverLicense",
    fields: {
      number: {
        label: "courier:signup.licenseNumber",
        placeholder: "DL12345",
        type: "text",
      },
      expiryDate: {
        label: "courier:signup.expiryDate",
        type: "date",
      },
    },
  },
  vehicleRegistration: {
    title: "courier:signup.vehicleRegistration",
    fields: {
      number: {
        label: "courier:signup.registrationNumber",
        placeholder: "DL01AB1234",
        type: "text",
      },
      expiryDate: {
        label: "courier:signup.expiryDate",
        type: "date",
      },
    },
  },
  insurance: {
    title: "courier:signup.insurance",
    fields: {
      number: {
        label: "courier:signup.insuranceNumber",
        placeholder: "INS123456",
        type: "text",
      },
      expiryDate: {
        label: "courier:signup.expiryDate",
        type: "date",
      },
    },
  },
};

export const PAYMENT_METHOD = {
  name: "paymentMethod",
  label: "courier:signup.paymentMethod",
  subLabel: "courier:signup.paymentMethodHint",
  type: "radio",
  value: "cash",
};
