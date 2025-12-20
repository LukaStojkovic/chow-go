import { Search } from "lucide-react";
import React from "react";
import { Input } from "./ui/input";

export default function Searchbar({
  placeholder,
  searchInput,
  setSearchInput,
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder || "Search..."}
        className="pl-10"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />
    </div>
  );
}
