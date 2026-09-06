import { create } from "zustand";

let nextId = 0;

export const useToastStore = create((set, get) => ({
  toasts: [],
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  push: (tone, title, options = {}) => {
    const id = ++nextId;
    set((state) => ({ toasts: [...state.toasts, { id, tone, title, ...options }] }));
    setTimeout(() => get().dismiss(id), options.duration ?? 4000);
    return id;
  },
}));

// Mirrors sonner's signature so ported web code compiles unchanged.
export const toast = {
  success: (title, options) => useToastStore.getState().push("success", title, options),
  error: (title, options) => useToastStore.getState().push("error", title, options),
  info: (title, options) => useToastStore.getState().push("info", title, options),
  warning: (title, options) => useToastStore.getState().push("warning", title, options),
};
