import { Button } from "@/components/ui/button";
import { User, Store } from "lucide-react";

export function RoleSelector({ role, setRole }) {
  return (
    <div className="flex gap-3 justify-center">
      <Button
        type="button"
        variant={role === "customer" ? "default" : "outline"}
        onClick={() => setRole("customer")}
        className="flex-1 h-12"
      >
        <User className="w-4 h-4 mr-2" />
        Customer
      </Button>
      <Button
        type="button"
        variant={role === "owner" ? "default" : "outline"}
        onClick={() => setRole("owner")}
        className="flex-1 h-12"
      >
        <Store className="w-4 h-4 mr-2" />
        Restaurant Owner
      </Button>
    </div>
  );
}
