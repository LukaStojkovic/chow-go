import LandingPage from "./pages/LandingPage";
import NotFoundPage from "./pages/NotFoundPage";
import DiscoverPage from "./pages/DiscoverPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Route, Routes, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./store/useAuthStore";
import { useDarkMode } from "./hooks/useDarkMode";
import Spinner from "./components/Spinner";
import CheckoutPage from "./pages/CheckoutPage";
import SellerRoute from "./components/Auth/components/SellerRoute";
import CustomerRoute from "./components/Auth/components/CustomerRoute";
import PublicRoute from "./components/Auth/components/PublicRoute";
import ProfilePage from "./pages/ProfilePage";
import MyOrders from "./pages/MyOrders";
import RestaurantPage from "./pages/RestaurantPage";
import CustomerLayout from "./components/Auth/components/CustomerLayout";
import ScrollToTop from "./hooks/ScrollToTop";
import SellerLayout from "./components/Auth/components/SellerLayout";
import { SellerDashboard } from "./pages/seller/SellerDashboard";
import { SellerOrders } from "./pages/seller/SellerOrders";
import { SellerMenu } from "./pages/seller/SellerMenu";
import { SellerAnalytics } from "./pages/seller/SellerAnalytics";
import { SellerSettings } from "./pages/seller/SellerSettings";
import AuthModal from "./components/Auth/AuthModal";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
    },
  },
});

function App() {
  const {
    checkAuth,
    isCheckingAuth,
    isAuthOpen,
    isLoginModal,
    closeAuthModal,
  } = useAuthStore();
  const { isDark } = useDarkMode();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) return <Spinner fullScreen />;

  return (
    <div>
      <QueryClientProvider client={queryClient}>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route element={<PublicRoute />}>
            <Route path="/discovery" element={<DiscoverPage />} />
          </Route>

          <Route element={<CustomerRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route element={<CustomerLayout />}>
              <Route
                path="/restaurant/:restaurantId"
                element={<RestaurantPage />}
              />
            </Route>
          </Route>

          <Route
            path="/seller"
            element={
              <SellerRoute>
                <SellerLayout />
              </SellerRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />

            <Route path="dashboard" element={<SellerDashboard />} />
            <Route path="orders" element={<SellerOrders />} />
            <Route path="menu" element={<SellerMenu />} />
            <Route path="analytics" element={<SellerAnalytics />} />
            <Route path="settings" element={<SellerSettings />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        <Toaster
          position="bottom-right"
          theme={isDark ? "dark" : "light"}
          toastOptions={{
            classNames: {
              toast:
                "bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-2xl rounded-2xl",
              title: "font-semibold",
              description: "text-gray-600 dark:text-gray-400",
              success:
                "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 shadow-xl",
              error:
                "bg-gradient-to-r from-red-500 to-pink-600 text-white border-0 shadow-xl",
              info: "bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 shadow-xl",
              warning:
                "bg-gradient-to-r from-orange-500 to-yellow-600 text-white border-0 shadow-xl",
              closeButton:
                "bg-white/20 dark:bg-gray-800/40 hover:bg-white/30 dark:hover:bg-gray-700/60 border border-white/30 dark:border-gray-700 text-white",
              actionButton:
                "bg-white/20 hover:bg-white/30 dark:bg-gray-800/40 dark:hover:bg-gray-700/60 text-white font-medium",
            },
          }}
          richColors
          duration={4000}
          expand
        />

        <AuthModal
          isOpen={isAuthOpen}
          setIsOpen={closeAuthModal}
          initialStep={isLoginModal ? "login" : "register"}
        />
      </QueryClientProvider>
    </div>
  );
}

export default App;
