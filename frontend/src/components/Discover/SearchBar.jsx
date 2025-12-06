import { Filter, Search } from "lucide-react";
import React from "react";

export default function SearchBar() {
  return (
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
  );
}
