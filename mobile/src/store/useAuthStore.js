import { create } from "zustand";
import { setUnauthorizedHandler } from "@/api/client";
import { clearToken, setToken } from "@/lib/secureToken";
import { checkAuth, loginUser, logoutUser } from "@/services/apiAuth";

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
  setUnauthorizedHandler(() => set({ authUser: null }));

  return {
    authUser: null,
    isCheckingAuth: true,
    isLoggingIn: false,

    setAuthUser: (authUser) => set({ authUser }),

    checkAuth: async () => {
      try {
        const user = await checkAuth();
        set({ authUser: user });
      } catch {
        set({ authUser: null });
      } finally {
        set({ isCheckingAuth: false });
      }
    },

    login: async (credentials) => {
      set({ isLoggingIn: true });
      try {
        const user = await persistSession(await loginUser(credentials));
        set({ authUser: user });
        return user;
      } finally {
        set({ isLoggingIn: false });
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
  };
});
