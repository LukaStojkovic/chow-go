import { motion } from "framer-motion";

export default function Logo() {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="flex items-center gap-2 cursor-pointer"
    >
      <div className="flex items-center gap-2 shrink-0">
        <img src="logos/chow-logo-filled.png" className="size-10" />
        <span className="text-base sm:text-xl font-bold tracking-tight hidden sm:inline">
          Chow & Go
        </span>
      </div>
    </motion.div>
  );
}
