import React from "react";
import { motion } from "framer-motion";
import { Bike, Star } from "lucide-react";

export default function ReputationStats() {
  return (
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
          <strong className="text-gray-900 dark:text-white">2M+</strong> happy
          customers
        </p>
      </div>

      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        ))}
        <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          4.9/5
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Bike className="w-5 h-5 text-green-600 dark:text-green-400" />
        <span>
          <strong className="text-gray-900 dark:text-white">18 min</strong> avg.
          delivery
        </span>
      </div>
    </motion.div>
  );
}
