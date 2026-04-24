import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export const SuccessScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4 text-center"
    >
      <div className="flex justify-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40"
          role="img"
          aria-label="Success"
        >
          <Check
            className="h-8 w-8 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
        </div>
      </div>{" "}
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Thank you! Your courier application has been submitted successfully.
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        We'll review your application and get back to you soon.
      </p>
    </motion.div>
  );
};
