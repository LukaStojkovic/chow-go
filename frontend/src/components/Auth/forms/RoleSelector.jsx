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
            ? "bg-primary hover:bg-primary text-primary-foreground shadow-lg "
            : "bg-card/50 hover:bg-card text-foreground border border-border "
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
            ? "bg-primary hover:bg-primary text-primary-foreground shadow-lg "
            : "bg-card/50 hover:bg-card text-foreground border border-border "
        }`}
      >
        <Store className="w-4 h-4 mr-2" />
        Restaurant Owner
      </Button>
    </div>
  );
}
