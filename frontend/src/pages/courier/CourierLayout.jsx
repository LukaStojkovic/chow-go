import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { PageTransition } from "@/components/layout/PageTransition";
import {
  LayoutDashboard,
  ListOrdered,
  Wallet,
  User,
  Power,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import Logo from "@/components/Navbar/Logo";
import { SidebarLink } from "@/components/ui/SidebarLink";
import UserMenu from "@/components/Navbar/UserMenu";
import { useEffect, useRef } from "react";
import { useSocket } from "@/contexts/SocketContext";
import useChangeCourierDutyStatus from "@/hooks/Courier/useChangeCourierDutyStatus";

export default function CourierLayout() {
  const location = useLocation();
  const { logout, authUser } = useAuthStore();
  const { socket, isRegistered } = useSocket();
  const { changeCourierDutyStatus, isChangingDutyStatus } =
    useChangeCourierDutyStatus();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(
    authUser?.courier?.isAvailable ?? false,
  );

  const watchIdRef = useRef(null);

  useEffect(() => {
    setIsAvailable(authUser?.courier?.isAvailable ?? false);
  }, [authUser]);

  const isDeliveryPage = location.pathname.startsWith("/courier/delivery");

  useEffect(() => {
    if (!socket || !isRegistered) return;

    const shouldTrackLocation = isAvailable || isDeliveryPage;

    if (shouldTrackLocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        ({ coords }) => {
          socket.emit("courier:location_update", {
            coordinates: [coords.longitude, coords.latitude],
          });
        },
        (err) => console.error("Geolocation error:", err),
        { enableHighAccuracy: true, maximumAge: 0 },
      );
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isAvailable, isDeliveryPage, socket, isRegistered]);

  const navItems = [
    { to: "/courier/dashboard", icon: LayoutDashboard, label: "Overview" },
    { to: "/courier/orders", icon: ListOrdered, label: "Deliveries" },
    // { to: "/courier/earnings", icon: Wallet, label: "Earnings" },
    { to: "/courier/profile", icon: User, label: "My Profile" },
  ];

  const currentTitle = isDeliveryPage
    ? "Active Delivery"
    : navItems.find((item) => item.to === location.pathname)?.label ||
      "Courier Portal";

  function handleChangeDutyStatus() {
    const nextStatus = !isAvailable;
    changeCourierDutyStatus(nextStatus, {
      onSuccess: () => setIsAvailable(nextStatus),
    });
  }

  return (
    <div className="min-h-screen flex overflow-hidden bg-muted text-foreground ">
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 transform border-r border-border bg-card transition-transform duration-300 ease-in-out 
          lg:static lg:translate-x-0
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex h-full flex-col p-6">
          <Logo className="mb-4" showTitle={true} />

          <div className="mb-6 rounded-2xl bg-muted p-4 border border-border ">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-muted-foreground ">
                Status
              </span>
              <button
                onClick={handleChangeDutyStatus}
                className={`relative flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
                  isAvailable
                    ? "bg-primary text-primary-foreground shadow-lg  hover:bg-primary"
                    : "bg-secondary text-muted-foreground hover:bg-secondary "
                }`}
              >
                <Power className="h-4 w-4" />
                {isAvailable ? "On duty" : "Off duty"}
              </button>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <SidebarLink
                key={item.to}
                {...item}
                onClick={() => setIsMobileMenuOpen(false)}
              />
            ))}
          </nav>

          <div className="mt-6 border-t border-border pt-6 ">
            <UserMenu user={authUser} onLogout={logout} />
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col h-screen overflow-hidden bg-muted ">
        <header className="flex shrink-0 items-center justify-between border-b border-border bg-card p-4 lg:hidden ">
          <span className="text-lg font-bold">{currentTitle}</span>
          <div className="flex items-center gap-3">
            <div
              className={`h-3 w-3 rounded-full ${isAvailable ? "bg-primary animate-pulse" : "bg-secondary "}`}
            />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-lg p-2 text-muted-foreground transition-transform hover:bg-muted active:scale-95 "
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </header>

        <div
          className={
            isDeliveryPage
              ? "flex flex-1 flex-col overflow-hidden"
              : "scroll-smooth flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10"
          }
        >
          <div
            className={
              isDeliveryPage
                ? "flex min-h-0 flex-1 flex-col"
                : "mx-auto max-w-5xl"
            }
          >
            {!isDeliveryPage && (
              <div className="mb-8 hidden lg:block">
                <h1 className="tracking-tight text-3xl font-extrabold text-foreground ">
                  {currentTitle}
                </h1>
                <p className="mt-2 text-muted-foreground ">
                  Manage your deliveries and track your earnings
                </p>
              </div>
            )}

            <PageTransition context={{ isAvailable }} />
          </div>
        </div>
      </main>
    </div>
  );
}
