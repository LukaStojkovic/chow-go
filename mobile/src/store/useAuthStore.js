import { create } from "zustand";
import { setUnauthorizedHandler } from "@/api/client";
import { clearToken, setToken } from "@/lib/secureToken";
import {
  checkAuth,
  loginUser,
  logoutUser,
  registerCustomer,
  requestPasswordReset,
  resetPassword,
  verifyOtp,
} from "@/services/apiAuth";

// The backend returns the token in the body only for X-Client: mobile callers.
// Strip it before it reaches component state - it belongs in SecureStore.
async function persistSession(user) {
  if (user?.token) {
    await setToken(user.token);
    const { token, ...rest } = user;
    return rest;
  }
  return user;
}

export const useAuthStore = create((set) => {
  setUnauthorizedHandler(() => {
    set({ authUser: null });
    // Imported lazily: the cart store imports this one.
    import("./useCartStore").then((m) => m.useCartStore.getState().clearLocalCart());
  });

  return {
    authUser: null,
    isCheckingAuth: true,
    isSubmitting: false,

    setAuthUser: (authUser) => set({ authUser }),

    checkAuth: async () => {
      try {
        set({ authUser: await checkAuth() });
      } catch {
        set({ authUser: null });
      } finally {
        set({ isCheckingAuth: false });
      }
    },

    login: async (credentials) => {
      set({ isSubmitting: true });
      try {
        const user = await persistSession(await loginUser(credentials));
        set({ authUser: user });
        return user;
      } finally {
        set({ isSubmitting: false });
      }
    },

    register: async (payload) => {
      set({ isSubmitting: true });
      try {
        const user = await persistSession(await registerCustomer(payload));
        set({ authUser: user });
        return user;
      } finally {
        set({ isSubmitting: false });
      }
    },

    logout: async () => {
      try {
        await logoutUser();
      } catch {
        // The token is cleared locally regardless; a failed call must not
        // strand the user in a signed-in state.
      }
      await clearToken();
      set({ authUser: null });
    },

    requestPasswordReset,
    verifyOtp,
    resetPassword,
  };
});
