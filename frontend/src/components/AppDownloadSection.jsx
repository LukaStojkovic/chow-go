import { Apple, Play } from "lucide-react";
import React from "react";
import { Button } from "./ui/button";
import { motion } from "framer-motion";

export default function AppDownloadSection() {
  return (
    <section id="download" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-500 via-teal-600 to-cyan-700 dark:from-emerald-600 dark:via-teal-700 dark:to-cyan-800 p-1 shadow-2xl"
        >
          <div className="bg-white dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl p-8 md:p-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                    Download Chow & Go
                    <span className="block text-emerald-600 dark:text-emerald-400">
                      Available Now
                    </span>
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mt-4">
                    Join millions who have already upgraded their food delivery
                    experience. Available on iOS and Android.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="bg-black hover:bg-gray-900 text-white font-medium"
                  >
                    <Apple className="w-6 h-6 mr-2" />
                    App Store
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium"
                  >
                    <Play className="w-6 h-6 mr-2" />
                    Google Play
                  </Button>
                </div>
              </div>

              <div className="relative flex justify-center">
                <div className="relative mx-auto w-64 md:w-80">
                  <img
                    src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=800&fit=crop"
                    alt="Chow & Go App on iPhone"
                    className="relative z-10 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-emerald-500/40 to-transparent dark:from-emerald-500/20 blur-3xl -z-10" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
