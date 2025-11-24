import { cn } from "@/lib/utils";
import React from "react";

export default function Spinner({
  size = "md",
  className,
  fullScreen = false,
}) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-4",
    lg: "w-12 h-12 border-[6px]",
  };

  const containerClasses = fullScreen
    ? "flex items-center justify-center min-h-screen bg-background"
    : "inline-flex items-center justify-center";

  return (
    <div className={cn(containerClasses, className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-gray-300 dark:border-gray-700 border-t-green-500 dark:border-t-green-400",
          sizeClasses[size]
        )}
      />
    </div>
  );
}
