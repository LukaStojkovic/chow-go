import { motion } from "framer-motion";

export default function Categories({
  categories,
  activeCategory,
  setActiveCategory,
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((cat) => (
        <motion.button
          key={cat.id}
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center gap-2"
          onClick={() => setActiveCategory(cat.name)}
        >
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl text-2xl shadow-sm transition-colors ${
              cat.color
            } ${activeCategory === cat.name ? "ring-2 ring-blue-500" : ""}`}
          >
            {cat.icon}
          </div>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {cat.name}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
