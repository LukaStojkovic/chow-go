import { LocateFixed, MapPin } from "lucide-react";
import React from "react";
import { Input } from "./ui/input";
import { motion } from "framer-motion";

export default function AddressInput({
  setLocation,
  location,
  detect,
  isDetecting,
  handleSubmit,
}) {
  return (
    <motion.form
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      onSubmit={handleSubmit}
      className="max-w-3xl mx-auto"
    >
      <div className="relative flex flex-col sm:flex-row gap-3 items-center justify-center">
        <div className="relative flex-1 w-full max-w-xl">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600 dark:text-green-400 z-10" />

          <Input
            type="text"
            placeholder="Enter delivery address (e.g. 123 Main St, New York)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="pl-12 pr-16 py-7 text-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-white/30 dark:border-gray-700/50 shadow-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-500/30 rounded-2xl w-full"
            required
          />

          <button
            type="button"
            onClick={detect}
            disabled={isDetecting}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-green-50 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
            aria-label="Auto-detect location"
          >
            {isDetecting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <LocateFixed className="w-5 h-5 text-green-600 dark:text-green-400" />
              </motion.div>
            ) : (
              <LocateFixed className="w-5 h-5 text-green-600 dark:text-green-400" />
            )}
          </button>
        </div>

        {/* <GlowButton
          type="submit"
          size="lg"
          className="h-14 px-8 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-xl rounded-2xl"
        >
          Find Food
          <Bike className="ml-2 w-5 h-5" />
        </GlowButton> */}
      </div>
    </motion.form>
  );
}
