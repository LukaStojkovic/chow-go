import { Filter, Search, Loader2 } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useDiscoverStore } from "@/store/useDiscoverStore";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { useNavigate } from "react-router-dom";

export default function MainSearchBar() {
  const [query, setQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const { searchRestaurants, searchItems, search, isSearching, clearSearch } = useDiscoverStore();
  const { coordinates } = useDeliveryStore();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length > 1 && coordinates?.lat && coordinates?.lon) {
        const { lat, lon } = coordinates;
        search(lat, lon, query);
        setIsDropdownOpen(true);
      } else {
        clearSearch();
        setIsDropdownOpen(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query, coordinates, search, clearSearch]);

  const handleSelect = (restaurantId) => {
    navigate(`/restaurant/${restaurantId}`);
    setIsDropdownOpen(false);
    setQuery("");
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (query.length > 1) setIsDropdownOpen(true);
        }}
        placeholder="Search for restaurants or specific food..."
        className="w-full rounded-xl border-none bg-gray-100 py-3 pl-10 pr-4 text-sm font-medium outline-none ring-2 ring-transparent transition-all focus:bg-white focus:ring-blue-500/20 focus:shadow-lg dark:bg-zinc-900 dark:focus:bg-zinc-800"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {isSearching && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700">
          <Filter className="h-4 w-4" />
        </button>
      </div>

      {isDropdownOpen && (searchRestaurants.length > 0 || searchItems.length > 0) && (
        <div className="absolute top-full left-0 mt-2 w-full max-h-[400px] overflow-y-auto rounded-xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10 z-50">
          {searchRestaurants.length > 0 && (
            <div className="p-2">
              <h3 className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                Restaurants
              </h3>
              {searchRestaurants.map((res) => (
                <button
                  key={`res-${res._id}`}
                  onClick={() => handleSelect(res._id)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <img
                    src={res.profilePicture || "https://placehold.co/100x100"}
                    alt={res.name}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {res.name}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-1">{res.cuisineType}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchItems.length > 0 && (
            <div className="p-2 border-t border-gray-100 dark:border-zinc-800">
              <h3 className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                Menu Items
              </h3>
              {searchItems.map((item) => (
                <button
                  key={`item-${item._id}`}
                  onClick={() => handleSelect(item.restaurant?._id)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <img
                    src={item.imageUrls?.[0] || "https://placehold.co/100x100"}
                    alt={item.name}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      From {item.restaurant?.name} &bull; ${item.price?.toFixed(2)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {isDropdownOpen && !isSearching && query.length > 1 && searchRestaurants.length === 0 && searchItems.length === 0 && (
        <div className="absolute top-full left-0 mt-2 w-full rounded-xl bg-white p-4 text-center shadow-xl ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10 z-50">
           <p className="text-sm text-gray-500">No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
}
