import React from "react";
import { motion } from "framer-motion";
import { Bike, Clock, Wallet, MapPin } from "lucide-react";

export default function Hero() {
  const perks = [
    {
      icon: Clock,
      title: "Flexible Hours",
      desc: "Work when you want, for as long as you want.",
    },
    {
      icon: Wallet,
      title: "Competitive Pay",
      desc: "Earn great money and keep 100% of your tips.",
    },
    {
      icon: MapPin,
      title: "Deliver Locally",
      desc: "Stay in your city and discover new local spots.",
    },
  ];

  return (
    <div className="flex w-full flex-col text-center lg:w-1/2 lg:text-left">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6 flex justify-center lg:justify-start"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/50 px-4 py-1.5 text-sm font-semibold text-emerald-700 backdrop-blur-sm dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-400">
          <Bike className="h-3.5 w-3.5" />
          <span>Join our fleet</span>
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-6xl md:text-7xl dark:text-white"
      >
        Deliver smiles. <br className="hidden sm:block" />
        <span className="bg-linear-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-400">
          Earn on your terms.
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-10 text-lg text-gray-500 sm:text-xl dark:text-gray-400"
      >
        Become a courier today. Enjoy flexible hours, competitive pay, and the
        freedom of the open road while delivering food from the best local
        restaurants.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1"
      >
        {perks.map((perk, index) => (
          <div key={index} className="flex items-start gap-4 text-left">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
              <perk.icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {perk.title}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">{perk.desc}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
