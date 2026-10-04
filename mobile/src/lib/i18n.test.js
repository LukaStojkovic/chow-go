import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import { LOCALE_STORAGE_KEY, currentLocale } from "@chowgo/shared/i18n";

import { clearCachedQueries, registerQueryClient, setLocale, setupI18n } from "./i18n";

jest.mock("expo-localization", () => ({ getLocales: jest.fn(() => []) }));

afterEach(() => registerQueryClient(null));

describe("setupI18n", () => {
  it("prefers the stored choice over the device", async () => {
    getLocales.mockReturnValue([{ languageTag: "sr-Latn-RS", languageCode: "sr" }]);
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, "en");
    await expect(setupI18n()).resolves.toBe("en");
  });

  it("falls back to the device language, stripping region and script", async () => {
    getLocales.mockReturnValue([{ languageTag: "de-DE", languageCode: "de" }, { languageTag: "sr-Latn-ME", languageCode: "sr" }]);
    await expect(setupI18n()).resolves.toBe("sr");
  });

  it("survives a storage failure or a device with no locale list", async () => {
    jest.spyOn(AsyncStorage, "getItem").mockRejectedValueOnce(new Error("io"));
    getLocales.mockImplementation(() => {
      throw new Error("no locales");
    });
    await expect(setupI18n()).resolves.toBe("en");
  });
});

describe("setLocale", () => {
  it("switches, persists and refreshes queries", async () => {
    const client = { invalidateQueries: jest.fn(), clear: jest.fn() };
    registerQueryClient(client);

    await expect(setLocale("sr")).resolves.toBe("sr");
    expect(currentLocale()).toBe("sr");
    await expect(AsyncStorage.getItem(LOCALE_STORAGE_KEY)).resolves.toBe("sr");
    expect(client.invalidateQueries).toHaveBeenCalledTimes(1);

    clearCachedQueries();
    expect(client.clear).toHaveBeenCalledTimes(1);
  });

  it("still switches when storage refuses the write", async () => {
    jest.spyOn(AsyncStorage, "setItem").mockRejectedValueOnce(new Error("full"));
    await expect(setLocale("sr")).resolves.toBe("sr");
    expect(() => clearCachedQueries()).not.toThrow();
  });
});
