/** Sign-in, sign-up, password reset and the Google role flow. */

export default {
  fields: {
    email: "Email",
    emailPlaceholder: "your@email.com",
    password: "Password",
    confirmPassword: "Confirm password",
    fullName: "Full name",
    phone: "Phone number",
    code: "Verification code",
  },

  roles: {
    heading: "How will you use Chow & Go?",
    customer: "Customer",
    customerDescription: "Order food from places near you.",
    seller: "Restaurant owner",
    sellerDescription: "List your restaurant and take orders.",
    courier: "Courier",
    courierDescription: "Deliver orders and earn on your own schedule.",
  },

  login: {
    title: "Welcome back",
    description: "Log in to track your orders and save favourites.",
    submit: "Log in",
    submitting: "Logging in...",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    noAccount: "Don't have an account?",
    orContinueWith: "Or continue with",
    continueWithGoogle: "Continue with Google",
    success: "Welcome back, {{name}}.",
  },

  register: {
    title: "Join Chow & Go",
    description: "Create an account to start ordering in seconds.",
    submit: "Sign up",
    submitting: "Creating account...",
    complete: "Complete registration",
    haveAccount: "Already have an account?",
    success: "Your account is ready.",
    photoLabel: "Profile photo",
    photoHint: "Optional, but it helps couriers recognise you.",
  },

  restaurant: {
    infoTitle: "Restaurant information",
    infoDescription: "Tell us about your restaurant",
    locationTitle: "Location & hours",
    locationDescription: "Where you are, and when you take orders",
    imagesTitle: "Photos & description",
    imagesDescription: "Add photos and describe your restaurant",

    namePlaceholder: "Restaurant name",
    phonePlaceholder: "Phone number",
    addressPlaceholder: "Restaurant address",
    cityPlaceholder: "City",
    statePlaceholder: "State / Province",
    zipPlaceholder: "Postcode",
    cuisinePlaceholder: "Select cuisine type",
    cuisineTypePlaceholder: "Cuisine type (e.g. Italian, Chinese)",
    descriptionPlaceholder: "Describe your restaurant (at least 10 characters)",
    imagesPlaceholder: "Upload restaurant photos (1-5 images)",

    mapHint: "Drag the pin to where couriers should collect from.",
    openingTime: "Opens at",
    closingTime: "Closes at",
    hoursHint: "You can set different hours per day later, in settings.",
  },

  reset: {
    title: "Reset password",
    emailDescription: "Enter your email to get a verification code",
    codeDescription: "Check your email for the 6-digit code",
    newPasswordDescription: "Choose a new password",
    sendCode: "Send code",
    verifyCode: "Verify code",
    verifying: "Verifying...",
    resendCode: "Resend code",
    setPassword: "Set new password",
    backToLogin: "Back to login",
    codeSent: "We sent a code to {{email}}.",
    success: "Your password was reset. You can log in now.",
    sendFailed: "We could not send the code. Try again.",
    verifyFailed: "We could not verify that code.",
    resetFailed: "We could not reset your password.",
  },

  google: {
    stepRole: "Choose your role",
    stepContact: "Contact details",
    stepCourierInfo: "Contact & vehicle",
    stepDocuments: "Documents",
    finishing: "Finishing your account...",
    failed: "We could not finish signing you in. Try again.",
    cancelled: "Sign-in was cancelled.",
  },

  guard: {
    signInRequired: "Sign in to continue",
    signInToOrder: "Sign in to add this to your basket",
    signInToFavourite: "Sign in to save favourites",
  },

  logout: {
    success: "You are logged out.",
  },
};
