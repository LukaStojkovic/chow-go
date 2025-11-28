import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "./ui/button";
import { Badge } from "@/components/ui/badge";
import { Bike, ChefHat, LocateFixed, MapPin, Star, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import useDetectLocation from "@/hooks/Location/useDetectLocation";

export default function HeroSection() {
  const [location, setLocation] = useState("");
  const { detect, address, isDetecting } = useDetectLocation();

  useEffect(() => {
    if (address) {
      setLocation(address);
    }
  }, [address]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (location.trim()) {
      toast.success("Searching restaurants!", {
        description: `Near: ${location}`,
        icon: <ChefHat className="w-5 h-5" />,
      });
    }
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
            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900/70 text-sm px-4 py-1">
              <Zap className="w-3 h-3 mr-1" />
              18 min average delivery
            </Badge>
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

              <Button
                type="submit"
                size="lg"
                className="h-14 px-8 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-xl rounded-2xl"
              >
                Find Food
                <Bike className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-8 mt-12"
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {["85", "23", "67", "41"].map((i) => (
                  <img
                    key={i}
                    src={`https://randomuser.me/api/portraits/men/${i}.jpg`}
                    alt="User"
                    className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 object-cover"
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong className="text-gray-900 dark:text-white">2M+</strong>{" "}
                happy customers
              </p>
            </div>

            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-5 h-5 fill-yellow-400 text-yellow-400"
                />
              ))}
              <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                4.9/5
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Bike className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span>
                <strong className="text-gray-900 dark:text-white">
                  18 min
                </strong>{" "}
                avg. delivery
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
