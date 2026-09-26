import { create } from "zustand";
import {
  apiForgotPassword,
  apiResetPassword,
  apiVerifyOtp,
  checkAuth,
  loginUser,
  logoutUser,
  registerCourier,
  registerUser,
  updateProfile,
  completeGoogleProfile,
} from "@/services/apiAuth";
import useCartStore from "./useCartStore";
import { axiosInstance, setUnauthorizedHandler } from "@/lib/axios";
import { toast } from "sonner";
import { t } from "@chowgo/shared/i18n";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isLoggingIn: false,
  isRegistering: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  isAuthOpen: false,
  isLoginModal: true,

  checkAuth: async () => {
    try {
      const response = await checkAuth();
      set({ authUser: response || null });
      return response;
    } catch (err) {
      // Only the server saying the session is gone ends it. A network blip or
      // a 5xx used to sign the user out on screen - a courier's checkAuth on
      // every assignment event bounced them out mid-delivery and stopped GPS.
      if (err?.response?.status === 401) {
        set({ authUser: null });
        return null;
      }
      return get().authUser;
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  register: async (data) => {
    set({ isRegistering: true });
    try {
      const response = await registerUser(data);
      set({ authUser: response || null });
    } catch (err) {
      console.log("Error in register", err);
    } finally {
      set({ isRegistering: false });
    }
  },

  registerCourier: async (data) => {
    set({ isRegistering: true });
    try {
      const response = await registerCourier(data);
      set({ authUser: response || null });
      return response;
    } catch (err) {
      console.error("Error in registerCourier", err);
      throw err;
    } finally {
      set({ isRegistering: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const response = await loginUser(data);
      set({ authUser: response || null });
    } catch (err) {
      console.log("Error in login", err);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await logoutUser();
      set({ authUser: null });
      useCartStore.getState().clearCart();
    } catch (err) {
      console.error("Error during logout: ", err);
    }
  },

  completeGoogleProfile: async (data) => {
    set({ isRegistering: true });
    try {
      const response = await completeGoogleProfile(data);
      set({ authUser: response || null });
      return response;
    } catch (err) {
      console.error("Error in completeGoogleProfile", err);
      throw err;
    } finally {
      set({ isRegistering: false });
    }
  },

  forgotPassword: async (email) => {
    const data = await apiForgotPassword(email);

    return data;
  },

  verifyOtp: async (email, code) => {
    const data = await apiVerifyOtp(email, code);

    return data;
  },

  resetPassword: async (resetToken, password) => {
    const data = await apiResetPassword(resetToken, password);

    return data;
  },

  apiUpdateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const response = await updateProfile(data);
      if (response?.data) {
        set({ authUser: response.data });
      }

      return response;
    } catch (err) {
      console.log(`Error in updatingProfile: ${err}`);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  apiUpdateRestaurant: async (formData) => {
    try {
      set({ isUpdatingProfile: true });
      const res = await axiosInstance.put("/restaurants/update", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      set({ authUser: res.data.user });
      toast.success(t("seller:settings.updated"));
    } catch (error) {
      console.error("Error updating restaurant:", error);
      toast.error(
        error.response?.data?.message || t("seller:settings.updateFailed"),
      );
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  openAuthModal: (isLogin = true) => {
    set({ isAuthOpen: true, isLoginModal: isLogin });
  },

  closeAuthModal: () => {
    set({ isAuthOpen: false });
  },
}));

setUnauthorizedHandler(() => {
  if (!useAuthStore.getState().authUser) return;
  useAuthStore.setState({ authUser: null });
  useCartStore.setState({ items: [], totalPrice: 0, restaurant: null });
  useAuthStore.getState().openAuthModal(true);
  toast.error(t("errors:byCode.TOKEN_REVOKED"));
});
