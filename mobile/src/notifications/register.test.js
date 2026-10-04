import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import { api } from "@/api/client";
import { reportError } from "@/lib/monitoring";
import { registerForPush, unregisterPush } from "./register";

jest.mock("expo-device", () => ({ __esModule: true, isDevice: true }));
jest.mock("expo-notifications", () => ({
  __esModule: true,
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  AndroidNotificationVisibility: { PUBLIC: 1, PRIVATE: 0 },
}));
jest.mock("@/lib/monitoring", () => ({ reportError: jest.fn() }));
jest.mock("expo-constants", () => ({ __esModule: true, default: { expoConfig: {}, easConfig: undefined } }));


beforeEach(async () => {
  jest.spyOn(api, "delete").mockResolvedValue({});
  await unregisterPush();
  jest.clearAllMocks();
  Device.isDevice = true;
  Constants.expoConfig = { extra: { eas: { projectId: "proj-1" } } };
  Notifications.getPermissionsAsync.mockResolvedValue({ status: "granted" });
  Notifications.getExpoPushTokenAsync.mockResolvedValue({ data: "ExponentPushToken[abc]" });
  jest.spyOn(api, "post").mockResolvedValue({});
});

describe("registerForPush", () => {
  it("sends the token with a per-install device id", async () => {
    await expect(registerForPush({ prompt: false })).resolves.toBe("ExponentPushToken[abc]");
    expect(api.post).toHaveBeenCalledWith("/notifications/register-device", {
      token: "ExponentPushToken[abc]",
      platform: expect.any(String),
      deviceId: expect.stringMatching(/^inst_/),
    });
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it("skips simulators", async () => {
    Device.isDevice = false;
    await expect(registerForPush()).resolves.toBeNull();
    expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
  });

  it("asks only when prompting is allowed and the OS will still ask", async () => {
    Notifications.getPermissionsAsync.mockResolvedValue({ status: "undetermined", canAskAgain: true });
    await expect(registerForPush({ prompt: false })).resolves.toBeNull();
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();

    Notifications.getPermissionsAsync.mockResolvedValue({ status: "denied", canAskAgain: false });
    await expect(registerForPush({ prompt: true })).resolves.toBeNull();
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();

    Notifications.getPermissionsAsync.mockResolvedValue({ status: "undetermined", canAskAgain: true });
    Notifications.requestPermissionsAsync.mockResolvedValue({ status: "granted" });
    await expect(registerForPush({ prompt: true })).resolves.toBe("ExponentPushToken[abc]");
  });

  it("reports a missing EAS project id instead of failing silently", async () => {
    Constants.expoConfig = { extra: {} };
    await expect(registerForPush()).resolves.toBeNull();
    expect(reportError).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ hint: expect.any(String) }));
    expect(api.post).not.toHaveBeenCalled();
  });

  it("reports and swallows a failed registration", async () => {
    api.post.mockRejectedValue(new Error("offline"));
    await expect(registerForPush()).resolves.toBeNull();
    expect(reportError).toHaveBeenCalledWith(expect.any(Error), { stage: "registerForPush" });
  });
});

describe("unregisterPush", () => {
  it("does nothing before registration", async () => {
    await unregisterPush();
    expect(api.delete).not.toHaveBeenCalled();
  });

  it("detaches the registered token once, even if the call fails", async () => {
    await registerForPush();
    api.delete.mockRejectedValueOnce(new Error("offline"));
    await expect(unregisterPush()).resolves.toBeUndefined();
    expect(api.delete).toHaveBeenCalledWith("/notifications/device", { data: { token: "ExponentPushToken[abc]" } });

    await unregisterPush();
    expect(api.delete).toHaveBeenCalledTimes(1);
  });
});
