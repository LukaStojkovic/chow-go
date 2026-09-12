/**
 * Server-side error copy.
 *
 * `AppError` carries a key from this namespace rather than a sentence, and
 * `controllers/errorController.js` renders it in the requesting user's locale.
 * The machine-readable `code` on the response is unchanged and is still what
 * clients branch on - this only decides what a person reads.
 *
 * `byCode` is the client-side safety net: if a response arrives with a code but
 * a message the client cannot show (an older server, a proxy error page), the
 * client renders `byCode.<CODE>` instead of raw English.
 */

export default {
  auth: {
    allFieldsRequired: "All fields are required",
    invalidCredentials: "That email and password do not match",
    useGoogle: "This account was created with Google. Sign in with Google instead.",
    missingFields: "Some required fields are missing",
    phoneRequiredCustomer: "A phone number is required for customers",
    phoneRequiredCourier: "A phone number is required for couriers",
    emailInUse: "That email is already in use",
    accountExists: "An account with this email already exists",
    fieldRequired: "{{field}} is required",
    hoursFormat: "Operating hours must be in 24-hour HH:MM format",
    restaurantImageRequired: "At least one restaurant image is required",
    invalidCoordinates: "Those coordinates are not valid",
    invalidVehicleType: "That vehicle type is not supported",
    vehicleTypeRequired: "A vehicle type is required for couriers",
    vehicleNumberRequired: "Vehicle number is required",
    vehicleModelRequired: "Vehicle model is required",
    roleRequired: "A valid role is required",
    userNotFound: "We could not find that account",
    invalidPhone: "That phone number is not valid",
    passwordFieldsRequired: "All password fields are required",
    passwordsMismatch: "The passwords do not match",
    currentPasswordIncorrect: "Your current password is not correct",
    noUpdates: "Nothing was sent to update",
    emailRequired: "An email address is required",
    otpInvalid: "That code is invalid or has expired",
    otpLocked: "Too many incorrect codes. Request a new one.",
    resetTokenInvalid: "That reset link is invalid or has expired",
    passwordMustBeText: "The password must be text",
    passwordTooShort: "The password must be at least {{count}} characters",
    passwordTooLong: "That password is too long ({{count}} bytes maximum)",
    missingCode: "The sign-in code is missing",
    signInLinkExpired: "That sign-in link expired. Please try again.",
    noToken: "You need to be signed in",
    invalidToken: "Your session is not valid",
    userGone: "Your account no longer exists",
    tokenRevoked: "Your session ended because the password changed",
    sessionInvalid: "Your session is no longer valid",
  },

  role: {
    sellerRequired: "Access denied. A seller account is required.",
    customerRequired: "Access denied. A customer account is required.",
    courierRequired: "Access denied. A courier account is required.",
  },

  cart: {
    menuItemIdRequired: "A menu item id is required",
    menuItemNotFound: "That dish is no longer on the menu",
    notFound: "Your basket is empty",
    itemNotFound: "That dish is not in your basket",
    quantityInvalid: "Quantity must be 0 or greater",
    differentRestaurant:
      "Your basket has dishes from another restaurant. Empty it first.",
  },

  address: {
    required: "An address and a location are required",
    notFound: "That address was not found",
    limitReached: "You can save at most {{count}} addresses",
  },

  favourite: {
    restaurantIdRequired: "A restaurant id is required",
    restaurantNotFound: "That restaurant was not found",
  },

  location: {
    coordinatesRequired: "Latitude and longitude are required",
    coordinatesInvalid: "Those latitude or longitude values are not valid",
    queryRequired: "A search term is required",
    serviceUnavailable: "The location service is not available right now",
    maxDistanceRange: "That search radius is out of range",
    invalid: "That location is not valid",
    noRestaurantsNearby: "No restaurants deliver to you yet",
    nearbyFailed: "We could not load restaurants near you",
    permissionDenied: "We need your location to show what delivers to you",
  },

  notification: {
    invalidToken: "That push token is not valid",
    invalidPlatform: "That platform is not supported",
  },

  order: {
    missingFields: "Some required fields are missing",
    cartEmpty: "Your basket is empty",
    addressNotFound: "That delivery address was not found",
    restaurantUnavailable: "That restaurant is not taking orders right now",
    restaurantClosed: "That restaurant is closed right now",
    itemUnavailable: "{{name}} is no longer available",
    notFound: "That order was not found",
    cancelNotAllowed: "This order has gone too far to cancel",
    statusConflict: "Someone else just updated this order. Reload and try again.",
    invalidTransition: "That is not a valid next step for this order",
    restaurantNotFound: "That restaurant was not found",
  },

  rating: {
    deliveredOnly: "You can only review delivered orders",
    restaurantRange: "The restaurant rating must be a whole number from 1 to 5",
    courierRange: "The courier rating must be a whole number from 1 to 5",
    reviewTooLong: "A review must be {{count}} characters or less",
    restaurantAlreadyRated: "You have already reviewed this restaurant",
    courierAlreadyRated: "You have already reviewed this courier",
    noneProvided: "No ratings were sent",
  },

  courier: {
    profileNotFound: "We could not find your courier profile",
    notFound: "That courier was not found",
    notVerified: "Your account has to be verified before you can take orders",
    notOnDuty: "You have to be on duty to accept orders",
    activeOrderExists: "You already have an active order",
    orderUnavailable: "That order is no longer available",
    onDutyWithActiveOrder: "You cannot go on duty while an order is still active",
    nameEmpty: "Your name cannot be empty",
    phoneEmpty: "Your phone number cannot be empty",
    noUpdates: "Nothing was sent to update",
    invalidCoordinates: "Those coordinates are not valid",
  },

  menuItem: {
    fieldsRequired: "A name, price and category are required",
    pricePositive: "The price must be a positive number",
    restaurantNotFound: "That restaurant was not found",
    notAuthorized: "You cannot change this restaurant",
    notFound: "That dish was not found",
    imageRequired: "At least one image is required",
  },

  restaurant: {
    notFound: "That restaurant was not found",
    invalidEmail: "That email address is not valid",
    invalidId: "That restaurant id is not valid",
    statsUnauthorized: "You cannot see this restaurant's statistics",
    unauthorized: "You do not have access to this restaurant",
  },

  promotion: {
    invalid: "{{reason}}",
    typeInvalid: "A promotion must be a percentage or a fixed amount",
    valuePositive: "The discount has to be greater than zero",
    maxPercent: "A promotion cannot take more than {{max}}% off",
    belowFloor: "That would price the dish below {{min}}",
    endsBeforeStart: "The promotion has to end after it starts",
    labelTooLong: "The badge text must be under {{max}} characters",
  },

  schedule: {
    invalidJson: "The schedule must be valid JSON",
    notAnObject: "The schedule must be an object keyed by day of week",
    invalidDay: '"{{day}}" is not a day of the week',
    dayNotAnObject: "The schedule for {{day}} must be an object",
    invalidTime: "{{day}} hours must be in 24-hour HH:MM format",
    noValues: "The schedule contained nothing to update",
  },

  request: {
    notFound: "No API route for {{method}} {{path}}",
    payloadTooLarge: "That request body is too large",
    invalidId: '"{{path}}" is not a valid {{kind}}',
    validationFailed: "Some of the values you sent are not valid",
    duplicate: "That {{field}} is already taken",
    invalidFieldName: '"{{field}}" is not an allowed field name',
    invalidQueryParam: '"{{field}}" is not an allowed query parameter',
    uploadTooLarge: "That file is too large",
    uploadTooMany: "Too many files",
    uploadRejected: "That upload was rejected",
    internal: "Something went wrong",
    generic: "Something went wrong",
  },

  account: {
    passwordRequired: "Enter your password to confirm",
    passwordIncorrect: "That password is not correct",
    activeOrders: "Finish or cancel your active orders before deleting your account",
    restaurantActiveOrders:
      "Your restaurant still has orders in progress. Close them first.",
    courierActiveOrder: "Finish your current delivery before deleting your account",
  },

  /**
   * Fallbacks keyed by the response's machine-readable `code`. Clients use
   * these when they would otherwise have to print the server's raw message.
   */
  byCode: {
    NO_TOKEN: "You need to be signed in",
    INVALID_TOKEN: "Your session is no longer valid",
    TOKEN_REVOKED: "Your session ended because the password changed",
    USER_GONE: "Your account no longer exists",
    ORDER_STATUS_CONFLICT:
      "Someone else just updated this order. Reload and try again.",
    INVALID_TRANSITION: "That is not a valid next step for this order",
    CANCEL_NOT_ALLOWED: "This order has gone too far to cancel",
    OTP_INVALID: "That code is invalid or has expired",
    OTP_LOCKED: "Too many incorrect codes. Request a new one.",
    RESET_TOKEN_INVALID: "That reset link is invalid or has expired",
    PASSWORD_INCORRECT: "That password is not correct",
    PASSWORD_REQUIRED: "Enter your password to confirm",
    PASSWORD_TOO_SHORT: "That password is too short",
    VALIDATION_FAILED: "Some of the values you sent are not valid",
    DUPLICATE: "That value is already taken",
    PAYLOAD_TOO_LARGE: "That request body is too large",
    INTERNAL_ERROR: "Something went wrong",
    RATE_LIMITED: "Too many attempts. Wait a moment and try again.",
    NETWORK: "We could not reach the server",
  },
};
