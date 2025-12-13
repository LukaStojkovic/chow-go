import { motion } from "framer-motion";

export default function Logo({
  className,
  title = "Chow & Go",
  showTitle = false,
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="flex items-center gap-2 cursor-pointer"
    >
      <div className={`flex items-center gap-2 shrink-0 ${className}`}>
        <img src="/logos/chow-logo-filled.png" className="size-10" />
        <span
          className={`text-base sm:text-xl font-bold tracking-tight ${
            showTitle ? "" : "hidden"
          } sm:inline`}
        >
          {title}
        </span>
      </div>
    </motion.div>
  );
}
