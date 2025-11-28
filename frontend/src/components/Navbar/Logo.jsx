import { UtensilsCrossed } from "lucide-react";
import { motion } from "framer-motion";

export default function Logo() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center gap-2"
    >
      <div className="w-10 h-10 bg-linear-to-br from-green-500 to-emerald-600 dark:from-green-400 dark:to-emerald-500 rounded-xl flex items-center justify-center shadow-lg ring-1 ring-black/5 dark:ring-white/10">
        <UtensilsCrossed className="w-6 h-6 text-white " />
      </div>

      <span className="text-2xl font-bold bg-linear-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
        Chow & Go
      </span>
    </motion.div>
  );
}
