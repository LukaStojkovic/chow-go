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
              className="w-10 h-10 rounded-full border-2 border-border object-cover"
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground ">
          <strong className="text-foreground ">2M+</strong> happy
          customers
        </p>
      </div>

      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-rating text-rating" />
        ))}
        <span className="ml-1 text-sm font-medium text-muted-foreground ">
          4.9/5
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground ">
        <Bike className="w-5 h-5 text-primary " />
        <span>
          <strong className="text-foreground ">18 min</strong> avg.
          delivery
        </span>
      </div>
    </motion.div>
  );
}
