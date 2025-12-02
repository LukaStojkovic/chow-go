import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Clock,
  Star,
  Filter,
  Bike,
  ChevronRight,
  Heart,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { motion } from "framer-motion";
import { useDeliveryStore } from "@/store/useDeliveryStore";

const CATEGORIES = [
  {
    id: 1,
    name: "Burgers",
    icon: "🍔",
    color: "bg-orange-100 dark:bg-orange-900/30",
  },
  {
    id: 2,
    name: "Sushi",
    icon: "🍣",
    color: "bg-blue-100 dark:bg-blue-900/30",
  },
  { id: 3, name: "Pizza", icon: "🍕", color: "bg-red-100 dark:bg-red-900/30" },
  {
    id: 4,
    name: "Asian",
    icon: "🍜",
    color: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  {
    id: 5,
    name: "Vegan",
    icon: "🥗",
    color: "bg-green-100 dark:bg-green-900/30",
  },
  {
    id: 6,
    name: "Dessert",
    icon: "🍩",
    color: "bg-pink-100 dark:bg-pink-900/30",
  },
  {
    id: 7,
    name: "Mexican",
    icon: "🌮",
    color: "bg-lime-100 dark:bg-lime-900/30",
  },
  {
    id: 8,
    name: "Drinks",
    icon: "🥤",
    color: "bg-purple-100 dark:bg-purple-900/30",
  },
];

const PROMOS = [
  {
    id: 1,
    title: "50% OFF Lunch",
    subtitle: "On selected partners",
    bg: "from-blue-600 to-indigo-600",
    img: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: 2,
    title: "Free Delivery",
    subtitle: "All weekend long",
    bg: "from-emerald-500 to-teal-500",
    img: "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 3,
    title: "New in Town",
    subtitle: "Try something fresh",
    bg: "from-orange-500 to-red-500",
    img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=80",
  },
];

const RESTAURANTS = [
  {
    id: 1,
    name: "Burger & Co.",
    rating: 4.8,
    reviews: "1.2k+",
    time: "20-30 min",
    deliveryFee: "Free",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    tags: ["American", "Burgers", "Fast Food"],
    promoted: true,
  },
  {
    id: 2,
    name: "Sushi Master",
    rating: 4.5,
    reviews: "500+",
    time: "35-45 min",
    deliveryFee: "$2.99",
    image:
      "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80",
    tags: ["Japanese", "Sushi", "Healthy"],
    promoted: false,
  },
  {
    id: 3,
    name: "La Pizzeria",
    rating: 4.9,
    reviews: "2k+",
    time: "25-35 min",
    deliveryFee: "$1.49",
    image:
      "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
    tags: ["Italian", "Pizza", "Comfort Food"],
    promoted: false,
  },
  {
    id: 4,
    name: "Green Bowl",
    rating: 4.6,
    reviews: "320",
    time: "15-25 min",
    deliveryFee: "$0.99",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
    tags: ["Healthy", "Salads", "Vegan"],
    promoted: false,
  },
  {
    id: 5,
    name: "Taco Fiesta",
    rating: 4.4,
    reviews: "850",
    time: "30-40 min",
    deliveryFee: "Free",
    image:
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80",
    tags: ["Mexican", "Tacos", "Spicy"],
    promoted: false,
  },
  {
    id: 6,
    name: "Wok 'n Roll",
    rating: 4.7,
    reviews: "1.5k",
    time: "25-40 min",
    deliveryFee: "$1.99",
    image:
      "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
    tags: ["Asian", "Noodles", "Chinese"],
    promoted: true,
  },
];

export default function DiscoverPage() {
  const { address } = useDeliveryStore();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");

  if (!address) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 text-gray-900 dark:bg-zinc-950 dark:text-gray-100">
      <header className="sticky top-0 z-40 border-b border-gray-200/50 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/80">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground">
                Delivering to
              </span>
              <div className="group flex cursor-pointer items-center gap-1 text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400">
                <span className="max-w-[200px] truncate font-bold sm:max-w-md">
                  {address}
                </span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:rotate-90" />
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-300">
                <ShoppingBag className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search food, groceries, etc..."
              className="w-full rounded-xl border-none bg-gray-100 py-3 pl-10 pr-4 text-sm font-medium outline-none ring-2 ring-transparent transition-all focus:bg-white focus:ring-blue-500/20 focus:shadow-lg dark:bg-zinc-900 dark:focus:bg-zinc-800"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700">
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl space-y-8 px-4 py-6">
        <section className="overflow-hidden">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {PROMOS.map((promo) => (
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
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Categories</h2>
            <button className="text-sm font-medium text-blue-600 dark:text-blue-400">
              See all
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-2"
                onClick={() => setActiveCategory(cat.name)}
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl text-2xl shadow-sm transition-colors ${
                    cat.color
                  } ${
                    activeCategory === cat.name ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                  {cat.icon}
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {cat.name}
                </span>
              </motion.button>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <MapPin className="h-5 w-5 text-blue-500" />
              Near You
            </h2>
            <div className="flex gap-2">
              <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium dark:bg-zinc-800">
                Rating 4.5+
              </span>
              <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium dark:bg-zinc-800">
                Under 30 min
              </span>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {RESTAURANTS.map((restaurant, idx) => (
              <RestaurantCard
                key={restaurant.id}
                data={restaurant}
                index={idx}
              />
            ))}
          </div>
        </section>

        <section className="pt-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Popular Right Now
            </h2>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
            {[...RESTAURANTS].reverse().map((restaurant, idx) => (
              <div key={restaurant.id} className="w-72 shrink-0">
                <RestaurantCard data={restaurant} index={idx} />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function RestaurantCard({ data, index }) {
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

          <div className="h-1 w-1 rounded-full bg-gray-300"></div>
          <span className="text-gray-500">$$$</span>
        </div>
      </div>
    </motion.div>
  );
}
