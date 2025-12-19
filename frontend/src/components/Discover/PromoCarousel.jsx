import { motion } from "framer-motion";

export default function PromoCarousel({ promos }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {promos.map((promo) => (
        <motion.div
          key={promo.id}
          whileHover={{ scale: 0.98 }}
          className="relative h-40 w-72 shrink-0 cursor-pointer overflow-hidden rounded-2xl sm:w-80"
        >
          <div
            className={`absolute inset-0 bg-linear-to-r ${promo.bg} opacity-90`}
          />
          <img
            src={promo.img}
            alt={promo.title}
            className="absolute inset-0 h-full w-full object-cover mix-blend-overlay"
          />
          <div className="relative flex h-full flex-col justify-center p-6 text-white">
            <h3 className="text-2xl font-bold">{promo.title}</h3>
            <p className="font-medium opacity-90">{promo.subtitle}</p>
            <button className="mt-3 w-fit rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black shadow-lg">
              See Details
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
