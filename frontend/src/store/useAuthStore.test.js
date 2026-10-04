import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import * as apiAuth from "@/services/apiAuth";
import { axiosInstance } from "@/lib/axios";
import { registerQueryClient } from "@/lib/i18n";
import { axiosError } from "@/test/utils";
import { useAuthStore } from "./useAuthStore";
import useCartStore from "./useCartStore";
import { useDeliveryStore } from "./useDeliveryStore";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/services/apiAuth", () => ({
  apiForgotPassword: vi.fn(),
  apiResetPassword: vi.fn(),
  apiVerifyOtp: vi.fn(),
  checkAuth: vi.fn(),
  loginUser: vi.fn(),
  logoutUser: vi.fn(),
  registerCourier: vi.fn(),
  registerUser: vi.fn(),
  updateProfile: vi.fn(),
  completeGoogleProfile: vi.fn(),
}));
vi.mock("@/services/apiCart", () => ({ clearCart: vi.fn().mockResolvedValue({}) }));

const user = { _id: "u1", role: "customer", name: "Ana" };
const queryClient = { clear: vi.fn(), invalidateQueries: vi.fn() };
const unauthorized = () => axiosInstance.interceptors.response.handlers[0].rejected;

beforeEach(() => {
  vi.clearAllMocks();
  registerQueryClient(queryClient);
  useAuthStore.setState({ authUser: null, isCheckingAuth: true, isAuthOpen: false, isLoggingIn: false });
  useDeliveryStore.setState({ address: "Knez Mihailova 1", coordinates: [44.8, 20.4], selectedDeliveryAddress: { _id: "a1" } });
  useCartStore.setState({ items: [{ menuItem: "m1" }], totalPrice: 10, restaurant: { _id: "r1" } });
});

describe("checkAuth", () => {
  it("stores the signed-in user", async () => {
    apiAuth.checkAuth.mockResolvedValue(user);
    await expect(useAuthStore.getState().checkAuth()).resolves.toEqual(user);
    expect(useAuthStore.getState()).toMatchObject({ authUser: user, isCheckingAuth: false });
  });

  it("signs out only when the server answers 401", async () => {
    useAuthStore.setState({ authUser: user });
    apiAuth.checkAuth.mockRejectedValue(axiosError(401));
    await expect(useAuthStore.getState().checkAuth()).resolves.toBeNull();
    expect(useAuthStore.getState().authUser).toBeNull();
  });

  it("keeps the session through a network blip or a 5xx", async () => {
    useAuthStore.setState({ authUser: user });
    apiAuth.checkAuth.mockRejectedValue(new Error("Network Error"));
    await expect(useAuthStore.getState().checkAuth()).resolves.toEqual(user);
    apiAuth.checkAuth.mockRejectedValue(axiosError(503));
    await useAuthStore.getState().checkAuth();
    expect(useAuthStore.getState()).toMatchObject({ authUser: user, isCheckingAuth: false });
  });
});

describe("login / register", () => {
  it("sets the user and clears the busy flag", async () => {
    apiAuth.loginUser.mockResolvedValue(user);
    await useAuthStore.getState().login({ email: "a@b.c", password: "x" });
    expect(useAuthStore.getState()).toMatchObject({ authUser: user, isLoggingIn: false });

    apiAuth.registerUser.mockResolvedValue({ ...user, _id: "u2" });
    await useAuthStore.getState().register({});
    expect(useAuthStore.getState()).toMatchObject({ authUser: { _id: "u2" }, isRegistering: false });
  });

  it("swallows login failures but rethrows courier and Google signup failures", async () => {
    apiAuth.loginUser.mockRejectedValue(axiosError(401));
    await expect(useAuthStore.getState().login({})).resolves.toBeUndefined();
    expect(useAuthStore.getState()).toMatchObject({ authUser: null, isLoggingIn: false });

    apiAuth.registerCourier.mockRejectedValue(new Error("taken"));
    await expect(useAuthStore.getState().registerCourier({})).rejects.toThrow("taken");
    apiAuth.completeGoogleProfile.mockRejectedValue(new Error("expired"));
    await expect(useAuthStore.getState().completeGoogleProfile({})).rejects.toThrow("expired");
    expect(useAuthStore.getState().isRegistering).toBe(false);
  });

  it("returns the account on courier and Google signup", async () => {
    apiAuth.registerCourier.mockResolvedValue({ ...user, role: "courier" });
    await expect(useAuthStore.getState().registerCourier({})).resolves.toMatchObject({ role: "courier" });
    apiAuth.completeGoogleProfile.mockResolvedValue(user);
    await expect(useAuthStore.getState().completeGoogleProfile({})).resolves.toEqual(user);
  });
});

describe("logout", () => {
  it("forgets the account's basket, cached queries and delivery address", async () => {
    useAuthStore.setState({ authUser: user });
    apiAuth.logoutUser.mockResolvedValue({});
    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().authUser).toBeNull();
    expect(queryClient.clear).toHaveBeenCalledOnce();
    expect(useDeliveryStore.getState()).toMatchObject({ address: "", coordinates: null, selectedDeliveryAddress: null });
    await vi.waitFor(() => expect(useCartStore.getState().items).toEqual([]));
  });

  it("stays signed in when the request fails", async () => {
    useAuthStore.setState({ authUser: user });
    apiAuth.logoutUser.mockRejectedValue(new Error("offline"));
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().authUser).toEqual(user);
    expect(queryClient.clear).not.toHaveBeenCalled();
  });
});

describe("profile and password flows", () => {
  it("updates the user from the profile response", async () => {
    useAuthStore.setState({ authUser: user });
    apiAuth.updateProfile.mockResolvedValue({ data: { ...user, name: "Ana M." } });
    await useAuthStore.getState().apiUpdateProfile({ name: "Ana M." });
    expect(useAuthStore.getState()).toMatchObject({ authUser: { name: "Ana M." }, isUpdatingProfile: false });

    apiAuth.updateProfile.mockResolvedValue({});
    await useAuthStore.getState().apiUpdateProfile({});
    expect(useAuthStore.getState().authUser.name).toBe("Ana M.");
  });

  it("passes the reset flow straight through", async () => {
    apiAuth.apiForgotPassword.mockResolvedValue({ ok: 1 });
    apiAuth.apiVerifyOtp.mockResolvedValue({ resetToken: "t" });
    apiAuth.apiResetPassword.mockResolvedValue({ ok: 2 });
    await expect(useAuthStore.getState().forgotPassword("a@b.c")).resolves.toEqual({ ok: 1 });
    await expect(useAuthStore.getState().verifyOtp("a@b.c", "123456")).resolves.toEqual({ resetToken: "t" });
    await expect(useAuthStore.getState().resetPassword("t", "pw")).resolves.toEqual({ ok: 2 });
    expect(apiAuth.apiVerifyOtp).toHaveBeenCalledWith("a@b.c", "123456");
  });

  it("updates the seller's restaurant and reports the outcome", async () => {
    const put = vi.spyOn(axiosInstance, "put").mockResolvedValue({ data: { user: { ...user, role: "seller" } } });
    await useAuthStore.getState().apiUpdateRestaurant(new FormData());
    expect(put).toHaveBeenCalledWith("/restaurants/update", expect.any(FormData), expect.any(Object));
    expect(useAuthStore.getState().authUser.role).toBe("seller");
    expect(toast.success).toHaveBeenCalled();

    put.mockRejectedValue(axiosError(400, { message: "Bad hours" }));
    await useAuthStore.getState().apiUpdateRestaurant(new FormData());
    expect(toast.error).toHaveBeenCalledWith("Bad hours");
    expect(useAuthStore.getState().isUpdatingProfile).toBe(false);
  });
});

describe("auth modal", () => {
  it("opens in login or signup mode and closes", () => {
    useAuthStore.getState().openAuthModal(false);
    expect(useAuthStore.getState()).toMatchObject({ isAuthOpen: true, isLoginModal: false });
    useAuthStore.getState().closeAuthModal();
    expect(useAuthStore.getState().isAuthOpen).toBe(false);
  });
});

describe("revoked session (401 from any request)", () => {
  it("signs out locally, empties the basket and asks to log in again", async () => {
    useAuthStore.setState({ authUser: user });
    await expect(unauthorized()(axiosError(401, {}, { config: { url: "/orders" } }))).rejects.toBeDefined();

    expect(useAuthStore.getState()).toMatchObject({ authUser: null, isAuthOpen: true, isLoginModal: true });
    expect(useCartStore.getState().items).toEqual([]);
    expect(queryClient.clear).toHaveBeenCalledOnce();
    expect(toast.error).toHaveBeenCalledOnce();
  });

  it("ignores a 401 when nobody is signed in", async () => {
    await expect(unauthorized()(axiosError(401, {}, { config: { url: "/orders" } }))).rejects.toBeDefined();
    expect(useAuthStore.getState().isAuthOpen).toBe(false);
    expect(toast.error).not.toHaveBeenCalled();
  });
});
