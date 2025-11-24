import { create } from "zustand";
import { checkAuth, loginUser, registerUser } from "@/services/apiAuth";

export const useAuthStore = create((set) => ({
  authUser: null,
  isLoggingIn: false,
  isRegistering: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,

  checkAuth: async () => {
    try {
      const response = await checkAuth();

      set({ authUser: response?.user || null });
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
      set({ authUser: response?.user || null });
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
      set({ authUser: response?.user || null });
    } catch (err) {
    } finally {
      set({ isLoggingIn: false });
    }
  },
}));
