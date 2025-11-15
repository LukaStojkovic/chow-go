import { Apple, Play } from "lucide-react";
import React from "react";
import { Button } from "./ui/button";
import { motion } from "framer-motion";

export default function AppDownloadSection() {
  return (
    <section id="download" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-500 via-teal-600 to-cyan-700 p-1"
        >
          <div className="bg-white rounded-3xl p-8 md:p-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Download Chow & Go
                  <span className="block text-emerald-600">Available Now</span>
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Join millions who have already upgraded their food delivery
                  experience. Available on iOS and Android.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="bg-black hover:bg-gray-900 text-white"
                  >
                    <Apple className="w-6 h-6 mr-2" />
                    App Store
                  </Button>
                  <Button size="lg" variant="outline" className="border-2">
                    <Play className="w-6 h-6 mr-2" />
                    Google Play
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="relative mx-auto w-64 md:w-80">
                  <img
                    src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=800&fit=crop"
                    alt="Chow & Go App on iPhone"
                    className="relative z-10 rounded-3xl shadow-2xl"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-emerald-500 to-transparent blur-3xl opacity-30 -z-10" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
