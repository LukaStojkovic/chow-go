import React from "react";
import { motion } from "framer-motion";
import {
  CircleCheck,
  Clock,
  DollarSign,
  Star,
  Truck,
  CalendarDays,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";

export function StatsGrid({ analytics, isLoading }) {
  const fmt = (n) => (n != null ? `$${n.toFixed(2)}` : "—");
  const dash = isLoading ? "—" : null;

  const summaryCards = [
    {
      title: "Today's earnings",
      value: dash ?? fmt(analytics?.today?.earnings),
      icon: DollarSign,
      colorClass:
        "bg-primary-subtle text-primary ",
    },
    {
      title: "Deliveries",
      subtitle: "today",
      value: dash ?? analytics?.today?.deliveries ?? 0,
      icon: Truck,
      colorClass:
        "bg-primary-subtle text-primary ",
    },
    {
      title: "Avg time",
      subtitle: "per delivery",
      value:
        dash ??
        (analytics?.today?.avgDeliveryTime > 0
          ? `${analytics.today.avgDeliveryTime}m`
          : "—"),
      icon: Clock,
      colorClass:
        "bg-warning-subtle text-warning ",
    },
  ];

  const periodCards = [
    {
      title: "This week",
      subtitle: `${dash ?? `${analytics?.week?.deliveries ?? 0} deliveries`}`,
      value: dash ?? fmt(analytics?.week?.earnings),
      icon: CalendarDays,
      colorClass:
        "bg-info-subtle text-info ",
    },
    {
      title: "This month",
      subtitle: `${dash ?? `${analytics?.month?.deliveries ?? 0} deliveries`}`,
      value: dash ?? fmt(analytics?.month?.earnings),
      icon: CalendarDays,
      colorClass:
        "bg-warning-subtle text-warning ",
    },
    {
      title: "All time",
      subtitle: `${dash ?? `${analytics?.allTime?.totalDeliveries ?? 0} deliveries`}`,
      value: dash ?? fmt(analytics?.allTime?.totalEarnings),
      icon: CalendarDays,
      colorClass:
        "bg-primary-subtle text-primary ",
    },
  ];

  const performanceCards = [
    {
      title: "Acceptance",
      value: dash ?? `${analytics?.allTime?.acceptanceRate ?? 100}%`,
      icon: CircleCheck,
      colorClass:
        "bg-primary-subtle text-primary ",
      showArrow: false,
    },
    {
      title: "Avg rating",
      value:
        dash ??
        (analytics?.allTime?.averageRating > 0
          ? analytics.allTime.averageRating.toFixed(1)
          : "—"),
      icon: Star,
      colorClass:
        "bg-warning-subtle text-warning ",
      showArrow: false,
    },
    {
      title: "Successful",
      value: dash ?? analytics?.allTime?.successfulDeliveries ?? 0,
      icon: Truck,
      colorClass:
        "bg-muted text-muted-foreground ",
      showArrow: false,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {summaryCards.map((card) => (
          <StatCard key={card.title} {...card} showArrow={false} />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {periodCards.map((card, i) => (
          <StatCard key={card.title} {...card} showArrow={false} />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {performanceCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>
    </div>
  );
}
