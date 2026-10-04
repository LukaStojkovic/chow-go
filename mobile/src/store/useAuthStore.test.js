import * as apiAuth from "@/services/apiAuth";
import * as apiGoogle from "@/services/apiGoogle";
import * as push from "@/notifications/register";
import * as tracking from "@/location/backgroundTracking";
import { api } from "@/api/client";
import { getToken, setToken } from "@/lib/secureToken";
import { registerQueryClient } from "@/lib/i18n";
import { axiosError } from "@/test/utils";
import { useAuthStore } from "./useAuthStore";
import { useCartStore } from "./useCartStore";
import { useDeliveryStore } from "./useDeliveryStore";

jest.mock("@/services/apiAuth");
jest.mock("@/services/apiGoogle");
jest.mock("@/notifications/register", () => ({ unregisterPush: jest.fn(async () => {}) }));
jest.mock("@/location/backgroundTracking", () => ({ stopBackgroundTracking: jest.fn(async () => {}) }));

const user = { _id: "u1", role: "customer", name: "Ana" };
const queryClient = { clear: jest.fn(), invalidateQueries: jest.fn() };
const unauthorized = () => api.interceptors.response.handlers[0].rejected;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  jest.clearAllMocks();
  registerQueryClient(queryClient);
  useAuthStore.setState({ authUser: null, isCheckingAuth: true, isSubmitting: false });
  useDeliveryStore.setState({ address: "Knez Mihailova 1", coordinates: [44.8, 20.4], selectedDeliveryAddress: { _id: "a1" } });
  useCartStore.setState({ items: [{ menuItem: "m1" }], totalPrice: 10, restaurant: { _id: "r1" } });
});

describe("checkAuth", () => {
  it("stores the user and finishes checking", async () => {
    apiAuth.checkAuth.mockResolvedValue(user);
    await useAuthStore.getState().checkAuth();
    expect(useAuthStore.getState()).toMatchObject({ authUser: user, isCheckingAuth: false });
  });

  it("signs out on a 401 but survives a network blip", async () => {
    useAuthStore.setState({ authUser: user });
    apiAuth.checkAuth.mockRejectedValue(new Error("Network Error"));
    await useAuthStore.getState().checkAuth();
    expect(useAuthStore.getState().authUser).toEqual(user);

    apiAuth.checkAuth.mockRejectedValue(axiosError(401));
    await useAuthStore.getState().checkAuth();
    expect(useAuthStore.getState()).toMatchObject({ authUser: null, isCheckingAuth: false });
  });
});

describe("signing in", () => {
  it("moves the token to SecureStore and keeps it out of state", async () => {
    apiAuth.loginUser.mockResolvedValue({ ...user, token: "jwt-1" });
    const result = await useAuthStore.getState().login({ email: "a@b.c", password: "x" });

    expect(result).toEqual(user);
    expect(useAuthStore.getState().authUser).toEqual(user);
    expect(useAuthStore.getState().authUser.token).toBeUndefined();
    await expect(getToken()).resolves.toBe("jwt-1");
    expect(useAuthStore.getState().isSubmitting).toBe(false);
  });

  it("rethrows a failed login and clears the busy flag", async () => {
    apiAuth.loginUser.mockRejectedValue(axiosError(400, { code: "INVALID_CREDENTIALS" }));
    await expect(useAuthStore.getState().login({})).rejects.toBeDefined();
    expect(useAuthStore.getState()).toMatchObject({ authUser: null, isSubmitting: false });
  });

  it("registers and completes a Google profile the same way", async () => {
    apiAuth.registerCustomer.mockResolvedValue({ ...user, token: "jwt-2" });
    await useAuthStore.getState().register({});
    await expect(getToken()).resolves.toBe("jwt-2");

    apiGoogle.completeGoogleProfile.mockResolvedValue({ ...user, _id: "u9", token: "jwt-3" });
    await useAuthStore.getState().completeGoogleProfile({ signupToken: "s", role: "customer" });
    expect(useAuthStore.getState().authUser).toEqual({ ...user, _id: "u9" });
    await expect(getToken()).resolves.toBe("jwt-3");
  });

  it("signs in with Google only when authenticated", async () => {
    apiGoogle.signInWithGoogle.mockResolvedValue({ status: "newUser", signupToken: "s" });
    await expect(useAuthStore.getState().signInWithGoogle()).resolves.toMatchObject({ status: "newUser" });
    expect(useAuthStore.getState().authUser).toBeNull();

    apiGoogle.signInWithGoogle.mockResolvedValue({ status: "authenticated", token: "jwt-g", user });
    await useAuthStore.getState().signInWithGoogle();
    expect(useAuthStore.getState().authUser).toEqual(user);
    await expect(getToken()).resolves.toBe("jwt-g");
  });
});

describe("logout and deletion", () => {
  it("unregisters push before dropping the token, then forgets the account", async () => {
    await setToken("jwt-1");
    useAuthStore.setState({ authUser: user });
    let tokenDuringUnregister;
    push.unregisterPush.mockImplementation(async () => {
      tokenDuringUnregister = await getToken();
    });
    apiAuth.logoutUser.mockResolvedValue({});

    await useAuthStore.getState().logout();

    expect(tokenDuringUnregister).toBe("jwt-1");
    await expect(getToken()).resolves.toBeNull();
    expect(useAuthStore.getState().authUser).toBeNull();
    expect(queryClient.clear).toHaveBeenCalledTimes(1);
    expect(tracking.stopBackgroundTracking).toHaveBeenCalledTimes(1);
    expect(useDeliveryStore.getState()).toMatchObject({ address: null, coordinates: null, selectedDeliveryAddress: null });
  });

  it("signs out locally even when the server call fails", async () => {
    await setToken("jwt-1");
    useAuthStore.setState({ authUser: user });
    apiAuth.logoutUser.mockRejectedValue(new Error("offline"));
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().authUser).toBeNull();
    await expect(getToken()).resolves.toBeNull();
  });

  it("keeps the session when deletion is refused", async () => {
    await setToken("jwt-1");
    useAuthStore.setState({ authUser: user });
    apiAuth.deleteAccount.mockRejectedValue(axiosError(400, { code: "WRONG_PASSWORD" }));
    await expect(useAuthStore.getState().deleteAccount("nope")).rejects.toBeDefined();
    expect(useAuthStore.getState().authUser).toEqual(user);
    await expect(getToken()).resolves.toBe("jwt-1");

    apiAuth.deleteAccount.mockResolvedValue({});
    await useAuthStore.getState().deleteAccount("right");
    expect(useAuthStore.getState().authUser).toBeNull();
    expect(queryClient.clear).toHaveBeenCalledTimes(1);
  });
});

describe("revoked session (401 from any request)", () => {
  it("signs out and forgets the account, like an explicit logout", async () => {
    useAuthStore.setState({ authUser: user });
    await expect(unauthorized()(axiosError(401))).rejects.toBeDefined();
    await flush();

    expect(useAuthStore.getState().authUser).toBeNull();
    expect(useCartStore.getState().items).toEqual([]);
    expect(queryClient.clear).toHaveBeenCalledTimes(1);
    expect(tracking.stopBackgroundTracking).toHaveBeenCalledTimes(1);
    expect(useDeliveryStore.getState().selectedDeliveryAddress).toBeNull();
  });

  it("leaves a signed-out visitor's delivery address alone", async () => {
    await expect(unauthorized()(axiosError(401))).rejects.toBeDefined();
    await flush();
    expect(useDeliveryStore.getState().address).toBe("Knez Mihailova 1");
    expect(queryClient.clear).not.toHaveBeenCalled();
  });
});
