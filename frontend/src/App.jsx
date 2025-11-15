import LandingPage from "./pages/LandingPage";
import NotFoundPage from "./pages/NotFoundPage";
import DiscoverPage from "./pages/DiscoverPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./store/useAuthStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
    },
  },
});

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="discovery" element={<DiscoverPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast:
                "bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl",
              title: "text-gray-900 font-semibold",
              description: "text-gray-600",
              success:
                "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0",
              error:
                "bg-gradient-to-r from-red-500 to-pink-600 text-white border-0",
              info: "bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0",
              warning:
                "bg-gradient-to-r from-orange-500 to-yellow-500 text-white border-0",
            },
          }}
          richColors
          duration={4000}
          expand
        />
      </QueryClientProvider>
    </div>
  );
}

export default App;
