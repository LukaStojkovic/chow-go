import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Promena: koristimo useNavigate
import { useAuthStore } from "@/store/useAuthStore";
import { useDarkMode } from "@/hooks/useDarkMode";
import {
  Camera,
  Edit2,
  Mail,
  Phone,
  Lock,
  Moon,
  Sun,
  LogOut,
  MapPin,
  Plus,
  Trash2,
  RefreshCw,
  Heart,
  ChevronLeft,
  CheckCircle2,
  Home,
  Briefcase,
  Star,
  ShieldCheck,
  Save,
  X,
} from "lucide-react";

// --- MOCK DATA ---
const MOCK_ADDRESSES = [
  {
    id: 1,
    label: "Home",
    address: "Bulevar Nemanjića 12, Niš",
    type: "home",
    isDefault: true,
  },
  {
    id: 2,
    label: "Office",
    address: "Obrenovićeva 45, Niš",
    type: "work",
    isDefault: false,
  },
];

const MOCK_ORDERS = [
  {
    id: "ORD-7721",
    restaurant: "Burger House",
    date: "Today, 14:30",
    total: "1.250 RSD",
    status: "Delivered",
    items: "2x Smash Burger, 1x Fries",
  },
  {
    id: "ORD-7720",
    restaurant: "Pizza Bar",
    date: "Yesterday, 20:15",
    total: "980 RSD",
    status: "Delivered",
    items: "1x Capricciosa 32cm",
  },
];

const MOCK_FAVORITES = [
  { id: 1, name: "Sushi Star", rating: 4.8, img: "🍣", category: "Japanese" },
  { id: 2, name: "Walter BBQ", rating: 4.9, img: "🍖", category: "Balkan" },
];

export default function ProfilePage() {
  const { authUser, logout } = useAuthStore();
  const { isDark, toggle } = useDarkMode();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(authUser?.name || "Unknown Name");
  const [phone, setPhone] = useState(authUser?.phone || "Unkown Number");
  const [addresses, setAddresses] = useState(MOCK_ADDRESSES);

  const handleSetDefaultAddress = (id) => {
    setAddresses(
      addresses.map((addr) => ({ ...addr, isDefault: addr.id === id }))
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-gray-100 pb-20 transition-colors duration-300">
      <header className="sticky top-0 z-40 border-b border-gray-200/50 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/80">
        <div className="container mx-auto max-w-5xl flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-xl font-bold truncate">My Profile</h1>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="w-full lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-zinc-800 flex flex-col items-center text-center overflow-hidden">
              <div className="relative group mb-4 shrink-0">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-gray-50 dark:border-zinc-800 shadow-inner">
                  <img
                    src={
                      authUser?.profilePicture ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
                    }
                    alt="Profile"
                    className="w-full h-full object-cover bg-gray-100 dark:bg-zinc-800"
                  />
                </div>
                <button className="absolute bottom-1 right-1 bg-blue-600 hover:bg-blue-700 text-white p-2 md:p-2.5 rounded-full shadow-lg transition-transform active:scale-95">
                  <Camera size={16} />
                </button>
              </div>

              {isEditing ? (
                <div className="w-full space-y-3">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-center font-bold text-lg md:text-xl bg-gray-100 dark:bg-zinc-800 rounded-lg py-2 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
                    placeholder="Full Name"
                  />
                  <div className="relative w-full">
                    <Phone
                      size={16}
                      className="absolute left-3 top-3 text-gray-400"
                    />
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-2 py-2 bg-gray-100 dark:bg-zinc-800 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
                      placeholder="Phone Number"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-semibold text-xs md:text-sm hover:opacity-90 transition flex items-center justify-center gap-1"
                    >
                      <Save size={14} /> Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="py-2 px-3 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-200 rounded-lg font-semibold text-xs md:text-sm hover:bg-gray-300 transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white w-full truncate px-2">
                    {name}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 mb-4 truncate w-full px-2">
                    {phone}
                  </p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center gap-1.5 hover:underline"
                  >
                    <Edit2 size={14} /> Edit details
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-zinc-800 space-y-1">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">
                Account
              </h3>

              <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-xl transition cursor-pointer group">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 shrink-0 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Mail size={18} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">Email</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {authUser?.email || "user@verylongdomainname.com"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="hidden sm:flex text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full items-center gap-1">
                    <ShieldCheck size={10} /> Verified
                  </span>
                  <button className="text-xs font-semibold text-blue-600 px-2 py-1 rounded bg-blue-50 dark:bg-transparent dark:hover:bg-zinc-800">
                    Edit
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-xl transition cursor-pointer">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 shrink-0 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
                    <Lock size={18} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">
                      Password
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ••••••••••
                    </span>
                  </div>
                </div>
                <button className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white shrink-0 ml-2">
                  Update
                </button>
              </div>

              <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-xl transition">
                <div className="flex items-center gap-3">
                  <div className="p-2 shrink-0 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-lg">
                    {isDark ? <Moon size={18} /> : <Sun size={18} />}
                  </div>
                  <span className="text-sm font-medium">Dark Mode</span>
                </div>
                <button
                  onClick={toggle}
                  className={`w-11 h-6 shrink-0 rounded-full p-1 transition-colors duration-300 flex items-center ${
                    isDark ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                      isDark ? "translate-x-5" : "translate-x-0"
                    }`}
                  ></div>
                </button>
              </div>

              <div className="pt-2 mt-2 border-t border-gray-100 dark:border-zinc-800">
                <button
                  onClick={logout}
                  className="w-full flex items-center cursor-pointer gap-3 p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition text-sm font-medium"
                >
                  <LogOut size={18} />
                  Log Out
                </button>
              </div>
            </div>
          </div>

          <div className="w-full lg:col-span-8 space-y-6">
            <section className="bg-white dark:bg-zinc-900 rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <MapPin size={20} className="text-blue-500" /> Saved Addresses
                </h2>
                <button className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition shadow-sm font-medium shrink-0">
                  <Plus size={16} />{" "}
                  <span className="hidden sm:inline">Add New</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      addr.isDefault
                        ? "border-blue-500 bg-blue-50/30 dark:bg-blue-900/10"
                        : "border-transparent bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800/80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div
                          className={`p-2 shrink-0 rounded-lg ${
                            addr.isDefault
                              ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50"
                              : "bg-gray-200 text-gray-500 dark:bg-zinc-700"
                          }`}
                        >
                          {addr.type === "home" ? (
                            <Home size={18} />
                          ) : (
                            <Briefcase size={18} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                            {addr.label}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {addr.address}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {!addr.isDefault && (
                          <button
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            title="Set Default"
                            className="p-1.5 text-gray-400 hover:text-blue-500 transition"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        <button className="p-1.5 text-gray-400 hover:text-red-500 transition">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="bg-white dark:bg-zinc-900 rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-zinc-800 md:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
                    Recent Orders
                  </h2>
                  <button className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                    View All
                  </button>
                </div>

                <div className="space-y-4">
                  {MOCK_ORDERS.map((order) => (
                    <div
                      key={order.id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-200 dark:hover:border-blue-900 transition-colors"
                    >
                      <div className="flex items-start gap-4 mb-3 sm:mb-0 overflow-hidden">
                        <div className="w-10 h-10 shrink-0 bg-gray-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-lg">
                          🍔
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">
                              {order.restaurant}
                            </h4>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                                order.status === "Delivered"
                                  ? "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400"
                                  : "bg-red-50 text-red-500"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {order.items}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {order.date} • {order.total}
                          </p>
                        </div>
                      </div>

                      <button className="flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition w-full sm:w-auto shrink-0">
                        <RefreshCw size={12} /> Re-order
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white dark:bg-zinc-900 rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-zinc-800 md:col-span-2">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Heart className="text-red-500 fill-red-500" size={20} />{" "}
                  Favorites
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {MOCK_FAVORITES.map((fav) => (
                    <div
                      key={fav.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer transition"
                    >
                      <div className="text-2xl shrink-0">{fav.img}</div>
                      <div className="min-w-0">
                        <h5 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                          {fav.name}
                        </h5>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Star
                            size={10}
                            className="fill-yellow-400 text-yellow-400 shrink-0"
                          />{" "}
                          {fav.rating} •{" "}
                          <span className="truncate">{fav.category}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
