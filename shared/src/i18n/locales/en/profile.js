/** Customer profile, saved addresses and account settings. */

export default {
  title: "Profile",
  greeting: "Hi, {{name}}",
  memberSince: "With us since {{date}}",

  sections: {
    account: "Account",
    addresses: "Saved addresses",
    preferences: "Preferences",
    support: "Help & support",
    danger: "Account",
  },

  account: {
    name: "Name",
    email: "Email",
    phone: "Phone number",
    photo: "Profile photo",
    changePhoto: "Change photo",
    removePhoto: "Remove photo",
    edit: "Edit profile",
    saved: "Your profile was updated.",
    password: "Password",
    changePassword: "Change password",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmPassword: "Confirm new password",
    passwordChanged: "Your password was changed. You will stay signed in here.",
  },

  preferences: {
    theme: "Appearance",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "Match my device",
    language: "Language",
    languageDescription: "Used across the app, and for order notifications.",
    notifications: "Notifications",
  },

  address: {
    heading: "Saved addresses",
    subtitle: "Up to {{max}} addresses. The default is used at checkout.",
    add: "Add address",
    addTitle: "Add a delivery address",
    editTitle: "Edit this address",
    save: "Save address",
    update: "Update address",
    delete: "Delete address",
    deleteTitle: "Delete this address?",
    deleteDescription: "It will be removed from your saved addresses.",
    setDefault: "Make default",
    isDefault: "Default",
    limitReached: "You have reached the limit of {{max}} saved addresses.",
    saved: "Address saved.",
    deleted: "Address deleted.",

    confirmLocation: "Confirm location",
    changeLocation: "Change location",
    selectedLocation: "Selected location",
    locationSelected: "Location selected",
    droppedPin: "Dropped pin",
    pinnedLocation: "Pinned location ({{lat}}, {{lng}})",
    customLabelPlaceholder: "Name this address",

    typeLabel: "Address type",
    typePlaceholder: "Select type...",
    buildingName: "Building name",
    buildingNamePlaceholder: "e.g. Green Life Residence",
    floor: "Floor",
    floorPlaceholder: "e.g. 4",
    apartment: "Apartment",
    apartmentPlaceholder: "e.g. 12A",
    entrance: "Entrance / Staircase",
    entrancePlaceholder: "e.g. A, B, Left",
    entranceHousePlaceholder: "e.g. Main entrance",
    doorCode: "Door / Gate number",
    doorCodePlaceholder: "e.g. 42B",
    saveAs: "Save as",
    notes: "Delivery notes",
    notesPlaceholder: "Gate code, landmarks, call before delivery...",

    empty: {
      title: "No saved addresses",
      description: "Add one and checkout gets a lot faster.",
    },
  },

  delivery: {
    deliverTo: "Deliver to",
    change: "Change",
    choose: "Choose a delivery address",
    detecting: "Finding your location...",
    useCurrent: "Use my current location",
    denied: "Location access is off. Enter an address instead.",
    unsupported: "This browser cannot share your location.",
    searchPlaceholder: "Search for a street or place",
    noResults: "Nothing matched that search.",
    recent: "Recent",
  },

  becomeCourier: {
    cta: "Deliver with Chow & Go",
    description: "Earn on your own schedule.",
  },

  deleteAccount: {
    title: "Delete account",
    description: "This removes your account and everything on it. It cannot be undone.",
    confirmLabel: "Enter your password to confirm",
    confirm: "Delete my account",
    cancel: "Keep my account",
    success: "Your account was deleted.",
  },

  logOut: {
    action: "Log out",
    title: "Log out?",
    description: "You will need to sign in again to order.",
    confirm: "Log out",
  },
};
