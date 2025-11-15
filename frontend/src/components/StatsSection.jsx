import { motion } from "framer-motion";

export default function StatsSection() {
  const stats = [
    { value: "4.9", label: "App Rating", suffix: "/5" },
    { value: "2M+", label: "Active Users" },
    { value: "50K+", label: "Daily Orders" },
    { value: "18", label: "Avg. Delivery", suffix: " mins" },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-linear-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {stat.value}
                {stat.suffix}
              </div>
              <p className="text-gray-600 mt-2">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
