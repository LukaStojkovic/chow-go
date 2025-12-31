import React from "react";
import { Search } from "lucide-react";

const MenuNavigation = ({
  searchQuery,
  setSearchQuery,
  categories,
  activeCategory,
  scrollToCategory,
}) => {
  return (
    <div className="sticky top-[60px] z-30 -mx-4 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm dark:bg-zinc-950/95 md:mx-0">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search menu..."
            className="h-9 w-48 rounded-full bg-gray-100 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="h-6 w-px bg-gray-300 mx-2 dark:bg-zinc-700" />
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => scrollToCategory(cat.slug)}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              activeCategory === cat.slug
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-400 dark:hover:bg-zinc-700"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MenuNavigation;
