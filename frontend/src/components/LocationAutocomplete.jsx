import { MapPin, LocateFixed, Loader2 } from "lucide-react";
import useLocationAutocomplete from "@/hooks/Location/useLocationAutocomplete";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useOutsideClick from "@/hooks/useOutsideClick";

export default function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Enter your delivery address...",
  onDetectClick,
  isDetecting = false,
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const ref = useOutsideClick(() => setShowDropdown(false), true);
  const { predictions = [], isLoading } = useLocationAutocomplete(value);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowDropdown(newValue.length > 0);
  };

  const handleItemSelect = (loc) => {
    onChange(loc.display_name);
    onSelect({
      address: loc.display_name,
      lat: parseFloat(loc.lat),
      lon: parseFloat(loc.lon),
    });
    setShowDropdown(false);
  };

  return (
    <div className="relative w-full" ref={ref}>
      <div className="relative group">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-emerald-600">
          <MapPin className="h-6 w-6" />
        </div>

        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => value.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="h-16 w-full rounded-full border-2 border-gray-100 bg-white pl-14 pr-36 text-lg font-medium text-gray-900 placeholder:text-gray-400 shadow-xl shadow-emerald-900/5 outline-none transition-all hover:border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:shadow-none dark:hover:border-zinc-700"
        />

        <div className="absolute right-2 top-2 bottom-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDetectClick?.();
              setShowDropdown(false);
            }}
            disabled={isDetecting}
            className="flex h-full items-center gap-2 rounded-full bg-emerald-600 px-6 font-bold text-white transition-all hover:bg-emerald-700 disabled:opacity-70 disabled:hover:bg-emerald-600"
          >
            {isDetecting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                <LocateFixed className="h-5 w-5" />
                <span className="hidden sm:inline">Locate Me</span>
              </div>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="absolute top-full left-0 right-0 z-50 mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : predictions.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                No results found for "{value}"
              </div>
            ) : (
              <ul className="max-h-64 overflow-y-auto">
                {predictions.map((loc) => (
                  <li
                    key={loc.place_id}
                    onClick={() => handleItemSelect(loc)}
                    className="flex cursor-pointer items-start gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800"
                  >
                    <div className="mt-1 rounded-full bg-gray-100 p-2 dark:bg-zinc-800">
                      <MapPin className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="truncate font-semibold text-gray-900 dark:text-gray-100">
                        {loc.display_place ||
                          loc.display_name.split(",")[0].trim()}
                      </div>
                      <div className="truncate text-sm text-gray-500 dark:text-gray-400">
                        {loc.display_name}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
