import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { i18next } from "@chowgo/shared/i18n";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

export function createWrapper(queryClient = createTestQueryClient(), { route = "/" } = {}) {
  return function Wrapper({ children }) {
    return (
      <I18nextProvider i18n={i18next}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </QueryClientProvider>
      </I18nextProvider>
    );
  };
}

export function renderWithProviders(ui, { queryClient, route } = {}) {
  return render(ui, { wrapper: createWrapper(queryClient, { route }) });
}

export function createFakeSocket() {
  const handlers = new Map();
  return {
    handlers,
    on: vi.fn((event, handler) => {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event).add(handler);
    }),
    off: vi.fn((event, handler) => {
      if (!handler) handlers.delete(event);
      else handlers.get(event)?.delete(handler);
    }),
    emit(event, payload) {
      for (const handler of handlers.get(event) ?? []) handler(payload);
    },
    listenerCount(event) {
      return handlers.get(event)?.size ?? 0;
    },
  };
}

export function axiosError(status, data = {}, extra = {}) {
  return Object.assign(new Error(`Request failed with status ${status}`), {
    response: { status, data },
    ...extra,
  });
}
