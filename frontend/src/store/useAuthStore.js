import { create } from "zustand";
import { checkAuth } from "@/services/apiAuth";
import { toast } from "sonner";

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
      toast.success("Registration successful!");
    } catch (err) {
      console.error("Error registering user: ", err);
    } finally {
      set({ isRegistering: false });
    }
  },
}));
