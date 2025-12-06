import { Button } from "@/components/ui/button";
import { User, Store } from "lucide-react";

export function RoleSelector({ role, setRole }) {
  return (
    <div className="flex gap-2 sm:gap-3 justify-center">
      <Button
        type="button"
        onClick={() => setRole("customer")}
        className={`flex-1 h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold transition-all ${
          role === "customer"
            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
            : "bg-white/50 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-zinc-700"
        }`}
      >
        <User className="w-4 h-4 mr-2" />
        Customer
      </Button>
      <Button
        type="button"
        onClick={() => setRole("seller")}
        className={`flex-1 h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold transition-all ${
          role === "seller"
            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
            : "bg-white/50 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-zinc-700"
        }`}
      >
        <Store className="w-4 h-4 mr-2" />
        Restaurant Owner
      </Button>
    </div>
  );
}
