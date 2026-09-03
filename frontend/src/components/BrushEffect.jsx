import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function BrushEffect() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, 50]);
  const y2 = useTransform(scrollY, [0, 300], [0, -50]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <motion.div
        style={{ y: y1 }}
        className="absolute top-20 -left-32 w-96 h-96    rounded-full blur-3xl"
      />
      <motion.div
        style={{ y: y2 }}
        className="absolute bottom-20 -right-32 w-96 h-96    rounded-full blur-3xl"
      />
    </div>
  );
}
