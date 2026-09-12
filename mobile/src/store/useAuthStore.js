import { create } from "zustand";
import { setUnauthorizedHandler } from "@/api/client";
import { clearToken, setToken } from "@/lib/secureToken";
import {
  completeGoogleProfile as googleComplete,
  signInWithGoogle as googleSignIn,
} from "@/services/apiGoogle";
import {
  checkAuth,
  loginUser,
  deleteAccount as deleteAccountApi,
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

    signInWithGoogle: async () => {
      set({ isSubmitting: true });
      try {
        const result = await googleSignIn();
        if (result.status === "authenticated") {
          const user = await persistSession({ ...result.user, token: result.token });
          set({ authUser: user });
        }
        return result;
      } finally {
        set({ isSubmitting: false });
      }
    },

    completeGoogleProfile: async (payload) => {
      set({ isSubmitting: true });
      try {
        const user = await persistSession(await googleComplete(payload));
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
      // Before the token is dropped: unregistering needs an authenticated call.
      await import("@/notifications/register").then((m) => m.unregisterPush());
      try {
        await logoutUser();
      } catch {
        // The token is cleared locally regardless; a failed call must not
        // strand the user in a signed-in state.
      }
      await clearToken();
      set({ authUser: null });
    },

    // Deletion is irreversible on the server, so the local session is torn
    // down the same way logout does it - the token it held is already dead.
    deleteAccount: async (password) => {
      await import("@/notifications/register").then((m) => m.unregisterPush());
      await deleteAccountApi(password);
      await clearToken();
      set({ authUser: null });
    },

    requestPasswordReset,
    verifyOtp,
    resetPassword,
  };
});
