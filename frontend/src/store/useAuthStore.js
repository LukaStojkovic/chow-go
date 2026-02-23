import { create } from "zustand";
import {
  apiForgotPassword,
  apiResetPassword,
  apiVerifyOtp,
  checkAuth,
  loginUser,
  logoutUser,
  registerUser,
  updateProfile,
} from "@/services/apiAuth";
import useCartStore from "./useCartStore";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";

export const useAuthStore = create((set) => ({
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
    } catch (err) {
      console.error("Error checking auth: ", err);
      set({ authUser: null });
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

  forgotPassword: async (email) => {
    const data = await apiForgotPassword(email);

    return data;
  },

  verifyOtp: async (email, code) => {
    const data = await apiVerifyOtp(email, code);

    return data;
  },

  resetPassword: async (email, password) => {
    const data = await apiResetPassword(email, password);

    return data;
  },

  apiUpdateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const response = await updateProfile(data);
      if (response.data) {
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
      toast.success("Restaurant updated successfully");
    } catch (error) {
      console.error("Error updating restaurant:", error);
      toast.error(
        error.response?.data?.message || "Failed to update restaurant",
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
