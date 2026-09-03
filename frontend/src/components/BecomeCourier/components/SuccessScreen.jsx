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
          className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-subtle "
          role="img"
          aria-label="Success"
        >
          <Check
            className="h-8 w-8 text-primary "
            aria-hidden="true"
          />
        </div>
      </div>{" "}
      <p className="text-sm text-muted-foreground ">
        Thank you! Your courier application has been submitted successfully.
      </p>
      <p className="text-xs text-muted-foreground ">
        We'll review your application and get back to you soon.
      </p>
    </motion.div>
  );
};
