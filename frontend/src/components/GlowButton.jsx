import React from "react";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function GlowButton({
  className,
  glowColor = "from-emerald-500 via-green-500 to-green-500",
  children,
  ...props
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative inline-block"
    >
      <motion.div
        animate={{
          opacity: [0.5, 0.8, 0.5],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={cn(
          "absolute -inset-1 rounded-lg bg-linear-to-r blur-xl",
          `bg-linear-to-r ${glowColor}`
        )}
      />
      <Button
        className={cn(
          "relative z-10 bg-linear-to-r text-white shadow-lg transition-all duration-300 hover:shadow-2xl",
          `bg-linear-to-r ${glowColor}`,
          className
        )}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  );
}
