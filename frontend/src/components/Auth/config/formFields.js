/**
 * Declarative field and step definitions for the auth modal.
 *
 * Every user-visible string here is a translation key, not copy: this module
 * is evaluated once at import time, long before a language is chosen, so a
 * resolved sentence would be frozen in whichever language loaded first.
 * `FormFieldRenderer` and `FormStepRenderer` call `t()` on these at render.
 */

export const FORM_FIELDS = {
  email: {
    name: "email",
    type: "email",
    placeholder: "auth:fields.email",
    validation: "email",
  },
  password: {
    name: "password",
    type: "password",
    placeholder: "auth:fields.password",
    validation: "password",
  },
  confirmPassword: {
    name: "confirmPassword",
    type: "password",
    placeholder: "auth:fields.confirmPassword",
    validation: "password",
  },
  name: {
    name: "name",
    type: "text",
    placeholder: "auth:fields.fullName",
    validation: "name",
  },
  restaurantName: {
    name: "restaurantName",
    type: "text",
    placeholder: "auth:restaurant.namePlaceholder",
    validation: "restaurantName",
  },
  restaurantPhone: {
    name: "restaurantPhone",
    type: "tel",
    placeholder: "auth:restaurant.phonePlaceholder",
    validation: "restaurantPhone",
  },
  restaurantAddress: {
    name: "restaurantAddress",
    type: "text",
    placeholder: "auth:restaurant.addressPlaceholder",
    validation: "restaurantAddress",
  },
  restaurantCity: {
    name: "restaurantCity",
    type: "text",
    placeholder: "auth:restaurant.cityPlaceholder",
    validation: "restaurantCity",
  },
  restaurantState: {
    name: "restaurantState",
    type: "text",
    placeholder: "auth:restaurant.statePlaceholder",
    validation: "restaurantState",
  },
  restaurantZipCode: {
    name: "restaurantZipCode",
    type: "text",
    placeholder: "auth:restaurant.zipPlaceholder",
    validation: "restaurantZipCode",
  },
  cuisineType: {
    name: "cuisineType",
    type: "text",
    placeholder: "auth:restaurant.cuisineTypePlaceholder",
    validation: "cuisineType",
  },
  restaurantDescription: {
    name: "restaurantDescription",
    type: "textarea",
    placeholder: "auth:restaurant.descriptionPlaceholder",
    validation: "restaurantDescription",
  },
  restaurantImages: {
    name: "restaurantImages",
    type: "file",
    placeholder: "auth:restaurant.imagesPlaceholder",
    validation: "restaurantImages",
    multiple: true,
  },
  code: {
    name: "code",
    type: "text",
    placeholder: "000000",
    validation: "code",
    maxLength: 6,
  },
};

export const FORM_CONFIGS = {
  login: {
    fields: ["email", "password"],
    title: "auth:login.title",
    description: "auth:login.description",
    submitText: "auth:login.submit",
    submitingText: "auth:login.submitting",
  },
  register: {
    fields: ["name", "email", "password"],
    title: "auth:register.title",
    description: "auth:register.description",
    submitText: "auth:register.submit",
    submitingText: "auth:register.submitting",
    hasRole: true,
    hasImage: true,
  },
  "restaurant-info": {
    fields: [
      "restaurantName",
      "restaurantPhone",
      "restaurantAddress",
      "restaurantCity",
      "restaurantState",
      "restaurantZipCode",
      "cuisineType",
    ],
    title: "auth:restaurant.infoTitle",
    description: "auth:restaurant.infoDescription",
    submitText: "auth:register.complete",
    submitingText: "auth:register.submitting",
    showBackButton: true,
  },
  forgot: {
    fields: ["email"],
    title: "auth:reset.title",
    description: "auth:reset.emailDescription",
    submitText: "auth:reset.sendCode",
    submitingText: "common:state.sending",
    customForm: true,
  },
  otp: {
    fields: ["code"],
    title: "auth:reset.title",
    description: "auth:reset.codeDescription",
    submitText: "auth:reset.verifyCode",
    submitingText: "auth:reset.verifying",
    customForm: true,
  },
  "restaurant-images": {
    fields: ["restaurantDescription", "restaurantImages"],
    title: "auth:restaurant.imagesTitle",
    description: "auth:restaurant.imagesDescription",
    submitText: "auth:register.complete",
    submitingText: "auth:register.submitting",
    showBackButton: true,
  },
};
