import { MapPin, LocateFixed } from "lucide-react";
import useLocationAutocomplete from "@/hooks/Location/useLocationAutocomplete";
import { useState, useRef, useEffect } from "react";
import Spinner from "./Spinner";
import { motion } from "framer-motion";
import useOutsideClick from "@/hooks/useOutsideClick";

export default function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Enter delivery address...",
  onDetectClick,
  isDetecting = false,
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const ref = useOutsideClick(() => setShowDropdown(false), true);
  const { predictions = [], isLoading } = useLocationAutocomplete(value);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (newValue.length > 0) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const handleItemSelect = (loc) => {
    onChange(loc.display_name);
    onSelect({
      address: loc.display_name,
      lat: parseFloat(loc.lat),
      lon: parseFloat(loc.lon),
    });

    setShowDropdown(false);

    ref.current?.querySelector("input")?.focus();
  };

  const shouldShowResults = showDropdown && value.length > 0;

  return (
    <div className="relative flex-1 w-full max-w-xl" ref={ref}>
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600 dark:text-green-400 z-10 pointer-events-none" />

        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => value.length > 0 && setShowDropdown(true)}
          onBlur={(e) => {
            if (
              !e.relatedTarget ||
              !e.relatedTarget.closest(".autocomplete-dropdown")
            ) {
              setTimeout(() => setShowDropdown(false), 100);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-12 pr-16 py-7 text-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-white/30 dark:border-gray-700/50 shadow-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-500/30 rounded-2xl outline-none transition-all"
        />

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDetectClick?.();
            setShowDropdown(false);
          }}
          disabled={isDetecting}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-green-50 dark:hover:bg-green-900/50 transition-colors z-10 disabled:opacity-60"
        >
          {isDetecting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <LocateFixed className="w-5 h-5 text-green-600 dark:text-green-400" />
            </motion.div>
          ) : (
            <LocateFixed className="w-5 h-5 text-green-600 dark:text-green-400" />
          )}
        </button>
      </div>

      {shouldShowResults && (
        <div
          className="autocomplete-dropdown absolute top-full mt-2 w-full max-w-xl z-9999 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden"
          tabIndex={-1}
        >
          {isLoading ? (
            <div className="py-6 text-center">
              <Spinner />
              <p className="text-sm text-muted-foreground mt-2">
                Searching location...
              </p>
            </div>
          ) : predictions.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              No results for "{value}"
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/70">
              {predictions.map((loc) => (
                <li
                  key={loc.place_id}
                  onClick={() => handleItemSelect(loc)}
                  className="flex items-center gap-4 p-3 cursor-pointer hover:bg-green-50/50 dark:hover:bg-gray-700/50 transition-colors duration-150 active:bg-green-100 dark:active:bg-gray-700"
                >
                  <MapPin className="h-5 w-5 text-green-700 dark:text-green-500 shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-gray-50 truncate">
                      {loc.display_place ||
                        loc.display_name.split(",")[0].trim()}
                    </div>

                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {loc.display_name.split(", ").slice(1).join(", ")}
                    </div>
                  </div>

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4 text-gray-400 dark:text-gray-500 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
