import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";

import { useAuthStore } from "./store/useAuthStore";
import { useDarkMode } from "./hooks/useDarkMode";
import { useMotionPreference } from "./hooks/useMotionPreference";
import { useGlobalSocketEvents } from "./hooks/Sockets/useGlobalSocketEvents";
import { SocketProvider } from "./contexts/SocketContext";
import ScrollToTop from "./hooks/ScrollToTop";
import Spinner from "./components/Spinner";
import { TooltipProvider } from "./components/ui/tooltip";
import { CustomerShell } from "./components/shell/CustomerShell";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { lazyNamed } from "./lib/lazyNamed";
import { routeChunks } from "./lib/routeChunks";
import { PortalShellSkeleton } from "./components/skeletons/PortalShellSkeleton";

import LandingPage from "./pages/LandingPage";
import NotFoundPage from "./pages/NotFoundPage";
import DiscoverPage from "./pages/DiscoverPage";
import SearchPage from "./pages/SearchPage";
import RestaurantPage from "./pages/RestaurantPage";
import FavouritesPage from "./pages/FavouritesPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import ProfilePage from "./pages/ProfilePage";
import BecomeCourierPage from "./pages/BecomeCourierPage";
import GoogleAuthCallbackPage from "./pages/GoogleAuthCallbackPage";
import AuthModal from "./components/Auth/AuthModal";

import PublicRoute from "./components/Auth/components/PublicRoute";
import CustomerRoute from "./components/Auth/components/CustomerRoute";
import SellerRoute from "./components/Auth/components/SellerRoute";
import CourierRoute from "./pages/courier/CourierRoute";
const SellerLayout = lazy(
  () => import("./components/Auth/components/SellerLayout"),
);
// Loaders come from the shared registry so a sidebar hover and the `lazy()`
// call below request the same chunk - see lib/routeChunks.js.
const SellerDashboard = lazyNamed(
  routeChunks["/seller/dashboard"],
  "SellerDashboard",
);
const SellerOrders = lazyNamed(routeChunks["/seller/orders"], "SellerOrders");
const SellerMenu = lazyNamed(routeChunks["/seller/menu"], "SellerMenu");
const SellerAnalytics = lazyNamed(
  routeChunks["/seller/analytics"],
  "SellerAnalytics",
);
const SellerSettings = lazyNamed(
  routeChunks["/seller/settings"],
  "SellerSettings",
);

const CourierLayout = lazy(() => import("./pages/courier/CourierLayout"));
const CourierDashboard = lazy(routeChunks["/courier/dashboard"]);
const CourierOrders = lazyNamed(
  routeChunks["/courier/orders"],
  "CourierOrders",
);
const CourierActiveDelivery = lazy(
  () => import("./pages/courier/CourierActiveDelivery"),
);
const CourierProfile = lazyNamed(
  routeChunks["/courier/profile"],
  "CourierProfile",
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Freshness is driven by socket-triggered invalidation rather than by
      // time - see hooks/Sockets/useGlobalSocketEvents.
      staleTime: 0,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { checkAuth, isCheckingAuth, isAuthOpen, isLoginModal, closeAuthModal } =
    useAuthStore();
  const { isDark } = useDarkMode();

  useGlobalSocketEvents();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) return <Spinner fullScreen />;

  return (
    <>
      <ScrollToTop />

      <Suspense fallback={<Spinner fullScreen />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/google/callback" element={<GoogleAuthCallbackPage />} />

          {/* Browsable without an account. Signing in is required at the point
              it actually matters - adding to the basket. */}
          <Route element={<PublicRoute />}>
            <Route element={<CustomerShell />}>
              <Route path="/discovery" element={<DiscoverPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/restaurant/:restaurantId" element={<RestaurantPage />} />
            </Route>
            <Route path="/become-courier" element={<BecomeCourierPage />} />
          </Route>

          <Route element={<CustomerRoute />}>
            <Route element={<CustomerShell />}>
              <Route path="/favourites" element={<FavouritesPage />} />
            </Route>

            {/* Focused screens: a back-and-title header, and no basket trigger
                competing with the task at hand. */}
            <Route
              element={<CustomerShell variant="detail" title="Your orders" backTo="/discovery" />}
            >
              <Route
                path="/orders"
                element={
                  <ErrorBoundary
                    name="my-orders"
                    title="We could not load your orders"
                  >
                    <MyOrdersPage />
                  </ErrorBoundary>
                }
              />
            </Route>
            <Route element={<CustomerShell variant="detail" title="Order" backTo="/orders" />}>
              <Route
                path="/orders/:orderId"
                element={
                  <ErrorBoundary
                    name="order-tracking"
                    title="We could not show this order"
                  >
                    <OrderTrackingPage />
                  </ErrorBoundary>
                }
              />
            </Route>
            <Route
              element={
                <CustomerShell
                  variant="detail"
                  title="Order confirmed"
                  showBasket={false}
                  showBottomNav={false}
                  backTo="/discovery"
                />
              }
            >
              <Route
                path="/orders/:orderId/confirmed"
                element={<OrderConfirmationPage />}
              />
            </Route>
            <Route
              element={
                <CustomerShell
                  variant="detail"
                  title="Checkout"
                  showBasket={false}
                  showBottomNav={false}
                />
              }
            >
              <Route
                path="/checkout"
                element={
                  <ErrorBoundary
                    name="checkout"
                    title="Checkout hit a problem"
                    description="Your basket is safe and nothing has been charged. Try again in a moment."
                  >
                    <CheckoutPage />
                  </ErrorBoundary>
                }
              />
            </Route>
            <Route element={<CustomerShell variant="detail" title="Profile" backTo="/discovery" />}>
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          <Route
            path="/seller"
            element={
              <SellerRoute>
                <Suspense fallback={<PortalShellSkeleton />}>
                  <SellerLayout />
                </Suspense>
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

          <Route
            path="/courier"
            element={
              <CourierRoute>
                <Suspense fallback={<PortalShellSkeleton />}>
                  <CourierLayout />
                </Suspense>
              </CourierRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<CourierDashboard />} />
            <Route path="orders" element={<CourierOrders />} />
            <Route path="delivery/:orderId" element={<CourierActiveDelivery />} />
            <Route path="profile" element={<CourierProfile />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>

      {/* Toasts inherit the app surface and the semantic status tokens rather
          than painting their own gradients. */}
      <Toaster
        position="bottom-center"
        theme={isDark ? "dark" : "light"}
        duration={4500}
        gap={8}
        toastOptions={{
          classNames: {
            toast:
              "bg-popover text-popover-foreground border border-border rounded-md shadow-overlay",
            title: "text-label",
            description: "text-body-sm text-muted-foreground",
            actionButton: "bg-primary text-primary-foreground rounded-sm text-label",
            cancelButton: "bg-muted text-muted-foreground rounded-sm text-label",
            success: "[&_[data-icon]]:text-success",
            error: "[&_[data-icon]]:text-destructive",
            warning: "[&_[data-icon]]:text-warning",
            info: "[&_[data-icon]]:text-info",
          },
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        setIsOpen={closeAuthModal}
        initialStep={isLoginModal ? "login" : "register"}
      />
    </>
  );
}

function App() {
  // Defaults to "user" - the OS preference - and only departs from it when
  // someone has explicitly chosen otherwise in Profile > Appearance.
  const { framerValue } = useMotionPreference();

  return (
    <QueryClientProvider client={queryClient}>
      {/* One place decides whether Framer variants animate; components never
          check `useReducedMotion()` themselves. */}
      <MotionConfig reducedMotion={framerValue}>
        <TooltipProvider delayDuration={300} skipDelayDuration={0}>
          <SocketProvider>
            <AppContent />
          </SocketProvider>
        </TooltipProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
}

export default App;
