import { View } from "react-native";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }) {
  return <View className={cn("rounded-md border border-border bg-card p-4", className)} {...props} />;
}
