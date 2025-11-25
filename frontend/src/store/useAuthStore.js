import { create } from "zustand";
import {
  apiForgotPassword,
  apiResetPassword,
  apiVerifyOtp,
  checkAuth,
  loginUser,
  logoutUser,
  registerUser,
} from "@/services/apiAuth";

export const useAuthStore = create((set) => ({
  authUser: null,
  isLoggingIn: false,
  isRegistering: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,

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
}));
