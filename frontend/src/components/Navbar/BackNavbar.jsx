import { ChevronLeft } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

export default function BackNavbar({ title }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/50 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/80">
      <div className="container mx-auto max-w-5xl flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
        <h1 className="text-xl font-bold truncate">{title}</h1>
      </div>
    </header>
  );
}
