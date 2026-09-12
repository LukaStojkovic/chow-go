/**
 * Form validation messages.
 *
 * Every zod schema on the platform points at a key in here through
 * `i18n/fieldErrors.js#msg`, so the same rule reads identically in the web
 * signup, the native signup and the seller's menu form.
 */

export default {
  required: "This field is required",

  auth: {
    nameRequired: "Name is required",
    ownNameRequired: "Your name is required",
    emailRequired: "Email is required",
    emailInvalid: "Enter a valid email address",
    passwordRequired: "Password is required",
    passwordMin: "Password must be at least {{count}} characters",
    passwordMax: "Password must not exceed {{count}} characters",
    passwordsMismatch: "Passwords do not match",
    phoneRequired: "Phone number is required",
    phoneMin: "Phone number must be at least {{count}} digits",
    phoneMax: "Phone number must not exceed {{count}} digits",
    phoneInvalid: "Phone number contains invalid characters",
    fullNameMin: "Full name must be at least {{count}} characters",
    fullNameMax: "Full name must not exceed {{count}} characters",
    codeLength: "Enter the {{count}}-digit code",
    roleRequired: "Choose how you want to use Chow & Go",
  },

  profile: {
    imageRequired: "A profile photo is required",
    imageType: "Please select an image",
    imageSize: "Image must be under {{size}}MB",
  },

  restaurant: {
    nameRequired: "Restaurant name is required",
    phoneRequired: "Restaurant phone number is required",
    addressRequired: "Street address is required",
    cityRequired: "City is required",
    zipRequired: "Postcode is required",
    cuisineRequired: "Pick a cuisine",
    descriptionRequired: "Tell customers what you serve",
    descriptionMin: "Description must be at least {{count}} characters",
    locationRequired: "Set your location on the map",
    openingRequired: "Opening time is required",
    closingRequired: "Closing time is required",
    timeFormat: "Use HH:MM",
    imagesRequired: "At least one image is required",
    imagesMax: "At most {{count}} images",
  },

  address: {
    labelRequired: "Give this address a name",
    streetRequired: "Street address is required",
    cityRequired: "City is required",
    typeRequired: "Pick what kind of place this is",
    pinRequired: "Drop a pin on the map",
    notesMax: "Keep instructions under {{count}} characters",
  },

  courier: {
    vehicleTypeRequired: "Pick what you deliver on",
    vehicleNumberRequired: "Vehicle number is required",
    vehicleNumberMax: "Vehicle number must not exceed {{count}} characters",
    vehicleModelRequired: "Vehicle model is required",
    vehicleModelMax: "Vehicle model must not exceed {{count}} characters",
    licenseNumberRequired: "Driver license number is required",
    licenseNumberMax: "Driver license number must not exceed {{count}} characters",
    licenseNotExpired: "License must not be expired",
    registrationNumberRequired: "Vehicle registration number is required",
    registrationNumberMax: "Vehicle registration must not exceed {{count}} characters",
    registrationNotExpired: "Registration must not be expired",
    insuranceNumberRequired: "Insurance number is required",
    insuranceNumberMax: "Insurance number must not exceed {{count}} characters",
    insuranceNotExpired: "Insurance must not be expired",
    paymentMethodRequired: "Payment method is required",
  },

  menuItem: {
    nameRequired: "Dish name is required",
    categoryRequired: "Please select a category",
    priceRequired: "Price is required",
    pricePositive: "Price must be a positive number",
    descriptionRequired: "Description is required",
    imagesRequired: "At least one image is required",
    imagesMax: "At most {{count}} images allowed",
    imageUnsupported: "Unsupported image",
  },

  promotion: {
    valueRequired: "Enter how much is off, or switch the promotion off",
    maxPercent: "At most {{max}}% off",
    belowFloor: "That leaves the price below {{min}}. Lower the discount.",
    endsBeforeStart: "The promotion has to end after it starts",
    labelMax: "Keep the badge text under {{max}} characters",
  },

  order: {
    notesMax: "Keep your note under {{count}} characters",
    ratingRequired: "Pick a rating first",
  },
};
