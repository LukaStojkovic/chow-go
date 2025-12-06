import { motion } from "framer-motion";

export default function StatsSection() {
  const stats = [
    { value: "4.9", label: "App Rating", suffix: "/5", emoji: "⭐" },
    { value: "2M+", label: "Active Users", suffix: "", emoji: "👥" },
    { value: "50K+", label: "Daily Orders", suffix: "", emoji: "🛍️" },
    { value: "18", label: "Avg. Delivery", suffix: " min", emoji: "⚡" },
  ];

  return (
    <section className="border-y border-gray-100 bg-white py-12 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center justify-center rounded-2xl bg-gray-50 p-6 text-center dark:bg-zinc-900"
            >
              <span className="mb-2 text-3xl">{stat.emoji}</span>
              <div className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                {stat.value}
                <span className="text-2xl text-emerald-600 dark:text-emerald-500">
                  {stat.suffix}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
