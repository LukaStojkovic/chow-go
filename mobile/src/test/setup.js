import { changeLanguage, initI18n } from "@chowgo/shared/i18n";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("expo-secure-store", () => {
  const store = new Map();
  return {
    __store: store,
    getItemAsync: jest.fn(async (key) => (store.has(key) ? store.get(key) : null)),
    setItemAsync: jest.fn(async (key, value) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key) => {
      store.delete(key);
    }),
  };
});

jest.mock("expo-crypto", () => {
  let n = 0;
  return {
    randomUUID: jest.fn(() => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`),
    digestStringAsync: jest.fn(async (_alg, value) => `sha256(${value})`),
    CryptoDigestAlgorithm: { SHA256: "SHA-256" },
    CryptoEncoding: { HEX: "hex" },
  };
});

jest.mock("expo-haptics", () => ({
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  NotificationFeedbackType: { Success: "success", Error: "error", Warning: "warning" },
  ImpactFeedbackStyle: { Light: "light", Medium: "medium" },
}));

jest.mock("expo-location", () => ({
  getForegroundPermissionsAsync: jest.fn(),
  requestBackgroundPermissionsAsync: jest.fn(),
  hasStartedLocationUpdatesAsync: jest.fn(async () => false),
  startLocationUpdatesAsync: jest.fn(),
  stopLocationUpdatesAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
  ActivityType: { OtherNavigation: 4 },
}));

jest.mock("expo-task-manager", () => {
  const tasks = new Map();
  return {
    __tasks: tasks,
    defineTask: jest.fn((name, fn) => tasks.set(name, fn)),
  };
});

initI18n({ locale: "en" });

beforeEach(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(async () => {
  jest.restoreAllMocks();
  require("expo-secure-store").__store.clear();
  await require("@react-native-async-storage/async-storage").clear();
  await changeLanguage("en");
});
