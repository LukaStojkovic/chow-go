import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import useDetectLocation from "@/hooks/Location/useDetectLocation";
import { useNavigate } from "react-router-dom";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { useAuthStore } from "@/store/useAuthStore";
import LocationAutocomplete from "./LocationAutocomplete";
import ReputationStats from "./ReputationStats";

export default function HeroSection() {
  const {
    detect,
    address: detectedAddress,
    coordinates: detectedCoords,
    isDetecting,
    clearDetectedLocation,
  } = useDetectLocation();
  const { setLocation } = useDeliveryStore();
  const { authUser } = useAuthStore();
  const navigate = useNavigate();
  const [locationInput, setLocationInput] = useState("");

  useEffect(() => {
    if (detectedAddress && detectedCoords) {
      setLocation(detectedAddress, detectedCoords);
      clearDetectedLocation();
      navigate("/discovery");
    }
  }, [detectedAddress, detectedCoords, setLocation, navigate]);

  const handleLocationSelect = (location) => {
    setLocation(location.address, {
      lat: location.lat,
      lon: location.lon,
    });
    navigate("/discovery");
  };

  return (
    <section className="relative flex min-h-[90vh] items-center justify-center pt-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/50 px-4 py-1.5 text-sm font-semibold text-emerald-700 backdrop-blur-sm dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Food delivery revolutionized</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 text-5xl font-extrabold tracking-tight leading-[1.1] text-gray-900 sm:text-6xl md:text-7xl lg:text-8xl dark:text-white"
          >
            Craving food? <br className="hidden sm:block" />
            <span className="bg-linear-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-400">
              We'll handle it.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-10 max-w-2xl text-lg text-gray-500 dark:text-gray-400 sm:text-xl"
          >
            Order from the best local restaurants with easy, on-demand delivery.
            Fresh food, delivered straight to your doorstep in minutes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full max-w-2xl"
          >
            {authUser?.role === "seller" || authUser?.role === "courier" ? (
              <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-2xl shadow-emerald-900/5 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="mb-4 text-center">
                  <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
                    Welcome back, {" "} 
                     {authUser.name}
                  </h2>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Access your administration portal to manage orders, menus, and deliveries.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(authUser.role === "seller" ? "/seller" : "/courier")}
                  className="mx-auto inline-flex h-16 w-full max-w-xs items-center justify-center rounded-full bg-emerald-600 px-8 text-base font-semibold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                >
                  {authUser.role === "seller" ? "Go to Seller Portal" : "Go to Courier Dashboard"}
                </button>
              </div>
            ) : (
              <LocationAutocomplete
                value={locationInput}
                onChange={setLocationInput}
                onSelect={handleLocationSelect}
                onDetectClick={detect}
                isDetecting={isDetecting}
              />
            )}
          </motion.div>

          <div className="mt-12 opacity-80 grayscale transition-all hover:grayscale-0">
            <ReputationStats />
          </div>
        </div>
      </div>
    </section>
  );
}
