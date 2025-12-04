import * as React from "react";
import { motion } from "framer-motion";

export function FoodCard({ image, title, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="group relative overflow-hidden rounded-2xl"
    >
      <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-linear-to-br from-orange-400 to-pink-500 shadow-lg">
        <img
          src={image}
          alt={title}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-xl font-bold text-white drop-shadow-lg">
            {title}
          </h3>
        </div>
      </div>
      <div className="absolute inset-0 rounded-2xl bg-linear-to-t from-primary/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </motion.div>
  );
}
