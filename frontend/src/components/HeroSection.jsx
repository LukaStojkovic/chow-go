import React, { useEffect, useState } from "react";
import { Bike, Sparkles, Star } from "lucide-react";
import { motion } from "framer-motion";
import useDetectLocation from "@/hooks/Location/useDetectLocation";
import { useNavigate } from "react-router-dom";
import { useDeliveryStore } from "@/store/useDeliveryStore";
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
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{ y: [0, 60, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-20 -left-32 w-96 h-96 bg-linear-to-br from-green-400 to-emerald-500 dark:from-green-500/30 dark:to-emerald-600/20 rounded-full blur-3xl opacity-20"
        />
        <motion.div
          animate={{ y: [0, -50, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-20 -right-32 w-80 h-80 bg-linear-to-br from-orange-400 to-amber-500 dark:from-orange-500/20 dark:to-amber-600/10 rounded-full blur-3xl opacity-15"
        />
      </div>

      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6 flex justify-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full border bg-linear-to-r from-primary/10 to-primary/5 px-4 py-2 text-sm backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <span className="font-medium">
                  Fast, Fresh, Delivered to Your Door
                </span>
              </div>
            </motion.div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
              Food Delivered
              <span className="block bg-linear-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                Faster Than Ever
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Over 10,000 restaurants. AI-powered recommendations. Doorstep
              delivery in minutes.
            </p>
          </motion.div>

          <form className="max-w-3xl mx-auto">
            <div className="relative flex flex-col sm:flex-row gap-3 items-center justify-center">
              <LocationAutocomplete
                value={locationInput}
                onChange={setLocationInput}
                onSelect={handleLocationSelect}
                onDetectClick={detect}
                isDetecting={isDetecting}
              />
            </div>
          </form>
          <ReputationStats />
        </div>
      </div>
    </section>
  );
}
