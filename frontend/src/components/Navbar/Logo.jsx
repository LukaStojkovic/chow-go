import { UtensilsCrossed } from "lucide-react";
import { motion } from "framer-motion";

export default function Logo() {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="flex items-center gap-2 cursor-pointer"
    >
      <div className="relative">
        <UtensilsCrossed />
        <div className="absolute -inset-1">
          <div className="h-full w-full animate-ping rounded-full bg-linear-to-br from-emerald-500 to-green-600 opacity-30" />
        </div>

        <div className="absolute -inset-2 opacity-20">
          <div className="h-full w-full animate-ping animation-delay-2000 rounded-full bg-linear-to-br from-emerald-500 to-green-600" />
        </div>
      </div>

      <span className="text-xl font-bold bg-linear-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">
        Chow & Go
      </span>
    </motion.div>
  );
}
