import { create } from "zustand";
import { setUnauthorizedHandler } from "@/api/client";
import { clearToken, setToken } from "@/lib/secureToken";
import { clearCachedQueries } from "@/lib/i18n";
import { useDeliveryStore } from "./useDeliveryStore";
import { stopBackgroundTracking } from "@/location/backgroundTracking";

// Otherwise the previous account's orders stay in memory and its saved address
// stays on disk for the next person on a shared phone.
function forgetAccountData() {
  clearCachedQueries();
  stopBackgroundTracking();
  useDeliveryStore.getState().clearLocation();
  useDeliveryStore.getState().setSelectedDeliveryAddress(null);
}
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
      } catch (error) {
        // A 401 is already handled by the client's unauthorized handler. A
        // network blip or a 5xx keeps the session instead of bouncing a courier
        // to the login screen mid-delivery.
        if (error?.response?.status === 401) set({ authUser: null });
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
      forgetAccountData();
    },

    // Deletion is irreversible on the server, so the local session is torn
    // down the same way logout does it - the token it held is already dead.
    deleteAccount: async (password) => {
      await import("@/notifications/register").then((m) => m.unregisterPush());
      await deleteAccountApi(password);
      await clearToken();
      set({ authUser: null });
      forgetAccountData();
    },

    requestPasswordReset,
    verifyOtp,
    resetPassword,
  };
});
