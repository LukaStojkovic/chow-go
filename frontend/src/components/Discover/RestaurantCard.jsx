import { motion } from "framer-motion";
import { Star, Heart, Bike } from "lucide-react";

export default function RestaurantCard({ data, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-xl dark:bg-zinc-900"
    >
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={data.image}
          alt={data.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-3 right-3 rounded-full bg-white/90 p-2 shadow-sm backdrop-blur-sm dark:bg-black/60">
          <Heart className="h-4 w-4 text-gray-400 transition-colors hover:fill-red-500 hover:text-red-500" />
        </div>
        {data.promoted && (
          <div className="absolute top-3 left-3 rounded-md bg-blue-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
            Promoted
          </div>
        )}

        <div className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-black shadow-md backdrop-blur-md">
          {data.time}
        </div>
      </div>

      <div className="p-4">
        <div className="mb-1 flex items-start justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {data.name}
          </h3>
          <div className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 dark:bg-zinc-800">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-bold">{data.rating}</span>
            <span className="text-[10px] text-gray-500">({data.reviews})</span>
          </div>
        </div>

        <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
          {data.tags.join(" • ")}
        </p>

        <div className="flex items-center gap-4 border-t border-gray-100 pt-3 text-sm dark:border-zinc-800">
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
            <Bike className="h-4 w-4 text-blue-500" />
            <span className="font-medium">{data.deliveryFee}</span>
          </div>

          <div className="h-1 w-1 rounded-full bg-gray-300" />
          <span className="text-gray-500">$$$</span>
        </div>
      </div>
    </motion.div>
  );
}
