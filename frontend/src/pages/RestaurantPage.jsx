import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Star,
  Clock,
  Bike,
  Info,
  MapPin,
  Phone,
  Plus,
  ShoppingBag,
  Heart,
  ChevronRight,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CartSidebar from "@/components/Discover/CartSidebar"; // Assuming you have this from previous code

// --- MOCK DATA FOR DEMO ---
const RESTAURANT_INFO = {
  id: 1,
  name: "Burger & Co.",
  rating: 4.8,
  ratingCount: "1.2k+",
  deliveryTime: "20-30 min",
  deliveryFee: "$1.99",
  minOrder: "$10.00",
  address: "123 Flavor Street, Foodville, FD 90210",
  phone: "+1 (555) 012-3456",
  description:
    "Authentic hand-crafted burgers made with premium grass-fed beef. We use locally sourced ingredients to bring you the best taste in town.",
  coverImage:
    "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1000&auto=format&fit=crop",
  logo: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=200&auto=format&fit=crop",
  hours: "Mon-Sun: 10:00 AM - 11:00 PM",
  tags: ["American", "Burgers", "Fast Food"],
};

const MENU_CATEGORIES = ["Popular", "Offers", "Burgers", "Sides", "Drinks"];

const MENU_ITEMS = [
  {
    id: 101,
    name: "Double Cheeseburger",
    description:
      "Two beef patties, cheddar cheese, lettuce, tomato, house sauce.",
    price: 14.99,
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500&auto=format&fit=crop",
    category: "Popular",
    isPopular: true,
  },
  {
    id: 102,
    name: "Crispy Chicken Combo",
    description:
      "Fried chicken sandwich served with regular fries and a drink.",
    price: 12.5,
    originalPrice: 16.5,
    image:
      "https://images.unsplash.com/photo-1619250907584-82a1f26b52e0?q=80&w=500&auto=format&fit=crop",
    category: "Offers",
    discount: "25% OFF",
  },
  {
    id: 103,
    name: "Classic Smash",
    description: "Smashed beef patty, onions, pickles, mustard.",
    price: 11.0,
    image:
      "https://images.unsplash.com/photo-1586190848861-99c8a3bd79a8?q=80&w=500&auto=format&fit=crop",
    category: "Burgers",
  },
  {
    id: 104,
    name: "Truffle Fries",
    description: "Crispy fries tossed in truffle oil and parmesan.",
    price: 6.5,
    image:
      "https://images.unsplash.com/photo-1573080496987-a199f8cd4054?q=80&w=500&auto=format&fit=crop",
    category: "Sides",
  },
  {
    id: 105,
    name: "Vanilla Shake",
    description: "Hand-spun vanilla bean milkshake with whipped cream.",
    price: 5.0,
    image:
      "https://images.unsplash.com/photo-1572490122747-3968b75cc699?q=80&w=500&auto=format&fit=crop",
    category: "Drinks",
  },
  // Add more items to fill the list for scrolling effect
  {
    id: 106,
    name: "Spicy Deluxe",
    description: "Jalapenos, spicy mayo, pepper jack.",
    price: 13.5,
    category: "Burgers",
    image:
      "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=500&auto=format&fit=crop",
  },
  {
    id: 107,
    name: "Onion Rings",
    description: "Beer battered onion rings.",
    price: 5.5,
    category: "Sides",
    image: null,
  }, // No image test
];

export default function RestaurantPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("Popular");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll for sticky header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToCategory = (category) => {
    setActiveCategory(category);
    const element = document.getElementById(category);
    if (element) {
      const offset = 120; // Height of sticky headers
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  const filteredItems = MENU_ITEMS.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white pb-24 text-gray-900 dark:bg-zinc-950 dark:text-gray-100">
      {/* --- Top Navigation (Absolute/Fixed) --- */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 transition-all duration-300 ${
          isScrolled
            ? "bg-white/90 shadow-sm backdrop-blur-md dark:bg-zinc-950/90"
            : "bg-transparent"
        }`}
      >
        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full ${
            isScrolled
              ? "bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800"
              : "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
          }`}
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {isScrolled && (
          <span className="font-bold text-lg animate-in fade-in slide-in-from-top-4">
            {RESTAURANT_INFO.name}
          </span>
        )}

        <div className="flex gap-3">
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full ${
              isScrolled
                ? "bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800"
                : "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
            }`}
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button
            onClick={() => setIsCartOpen(true)}
            className={`rounded-full ${
              isScrolled
                ? "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-100"
                : "bg-white text-gray-900 hover:bg-gray-100"
            }`}
          >
            <ShoppingBag className="h-5 w-5" />
          </Button>
        </div>
      </nav>

      {/* --- Hero Image & Basic Info --- */}
      <div className="relative h-[250px] w-full md:h-[350px]">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
        <img
          src={RESTAURANT_INFO.coverImage}
          alt="Cover"
          className="h-full w-full object-cover"
        />
      </div>

      <main className="container mx-auto max-w-4xl px-4 -mt-10 relative z-20">
        {/* Restaurant Title Card */}
        <div className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-gray-100 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-2xl font-extrabold sm:text-3xl">
                {RESTAURANT_INFO.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {RESTAURANT_INFO.tags.join(" • ")} • {RESTAURANT_INFO.minOrder}{" "}
                Min order
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 dark:bg-zinc-800 shrink-0">
              <img
                src={RESTAURANT_INFO.logo}
                alt="Logo"
                className="h-full w-full object-cover rounded-xl"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-medium">
            <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span>
                {RESTAURANT_INFO.rating}{" "}
                <span className="text-blue-600/70 dark:text-blue-400/70 font-normal">
                  ({RESTAURANT_INFO.ratingCount})
                </span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
              <Clock className="h-4 w-4" />
              <span>{RESTAURANT_INFO.deliveryTime}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
              <Bike className="h-4 w-4" />
              <span>{RESTAURANT_INFO.deliveryFee}</span>
            </div>
            <button
              onClick={() => setShowInfoModal(true)}
              className="ml-auto text-blue-600 hover:underline text-sm font-medium flex items-center gap-1"
            >
              More info <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* --- Sticky Menu Categories --- */}
        <div className="sticky top-[60px] z-30 -mx-4 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm dark:bg-zinc-950/95 md:mx-0 md:rounded-b-lg">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search menu..."
                className="h-8 w-40 rounded-full bg-gray-100 pl-8 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="h-6 w-px bg-gray-300 mx-2 dark:bg-zinc-700" />
            {MENU_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => scrollToCategory(cat)}
                className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  activeCategory === cat
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-400 dark:hover:bg-zinc-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* --- Menu Sections --- */}
        <div className="mt-6 space-y-10">
          {/* 1. Best Offers Horizontal Scroll */}
          {!searchQuery && (
            <div id="Offers" className="scroll-mt-32">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <Percent className="h-5 w-5 text-red-500" />
                Best Offers
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                {MENU_ITEMS.filter((i) => i.category === "Offers").map(
                  (item) => (
                    <div
                      key={item.id}
                      className="min-w-[280px] rounded-xl border border-gray-100 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50"
                    >
                      <div className="relative mb-3 h-32 w-full overflow-hidden rounded-lg">
                        <img
                          src={item.image}
                          className="h-full w-full object-cover"
                          alt={item.name}
                        />
                        <div className="absolute top-2 left-2 rounded bg-red-500 px-2 py-1 text-xs font-bold text-white">
                          {item.discount}
                        </div>
                      </div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold">{item.name}</h4>
                          <div className="mt-1 flex gap-2">
                            <span className="text-red-500 font-bold">
                              ${item.price.toFixed(2)}
                            </span>
                            <span className="text-gray-400 line-through text-sm">
                              ${item.originalPrice}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="h-8 w-8 rounded-full p-0 bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* 2. Vertical Lists for other categories */}
          {MENU_CATEGORIES.filter((cat) => cat !== "Offers").map((category) => {
            const items = filteredItems.filter(
              (item) => item.category === category
            );
            if (items.length === 0) return null;

            return (
              <section key={category} id={category} className="scroll-mt-32">
                <h3 className="mb-4 text-xl font-bold">{category}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="group flex cursor-pointer justify-between gap-4 rounded-xl border border-transparent bg-white p-4 shadow-sm transition-all hover:border-blue-100 hover:shadow-md dark:bg-zinc-900 dark:hover:border-zinc-700"
                    >
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900 dark:text-gray-50">
                              {item.name}
                            </h4>
                            {item.isPopular && (
                              <span className="text-[10px] font-bold text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded uppercase">
                                Popular
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-500 line-clamp-2 dark:text-gray-400">
                            {item.description}
                          </p>
                        </div>
                        <div className="mt-3 font-semibold text-gray-900 dark:text-gray-100">
                          ${item.price.toFixed(2)}
                        </div>
                      </div>

                      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-zinc-800">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-300">
                            <ShoppingBag className="h-8 w-8 opacity-20" />
                          </div>
                        )}
                        <button className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition-transform active:scale-95 dark:bg-zinc-800">
                          <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      {/* --- Restaurant Info Modal --- */}
      {showInfoModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 animate-in slide-in-from-bottom-10">
            <div className="relative h-32 bg-gray-100">
              {/* Mini Map Placeholder */}
              <div className="absolute inset-0 flex items-center justify-center bg-blue-50 text-blue-200">
                <MapPin className="h-12 w-12 opacity-50" />
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="absolute top-4 right-4 bg-white/80 p-1 rounded-full text-gray-900 hover:bg-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {RESTAURANT_INFO.name}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  {RESTAURANT_INFO.description}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-gray-500">
                      {RESTAURANT_INFO.address}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium">Opening Times</p>
                    <p className="text-sm text-gray-500">
                      {RESTAURANT_INFO.hours}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium">Contact</p>
                    <p className="text-sm text-blue-600">
                      {RESTAURANT_INFO.phone}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => setShowInfoModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
