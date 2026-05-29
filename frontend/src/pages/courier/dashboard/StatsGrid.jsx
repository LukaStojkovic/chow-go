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
        "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    {
      title: "Deliveries",
      subtitle: "today",
      value: dash ?? analytics?.today?.deliveries ?? 0,
      icon: Truck,
      colorClass:
        "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
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
        "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    },
  ];

  const periodCards = [
    {
      title: "This week",
      subtitle: `${dash ?? `${analytics?.week?.deliveries ?? 0} deliveries`}`,
      value: dash ?? fmt(analytics?.week?.earnings),
      icon: CalendarDays,
      colorClass:
        "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
    },
    {
      title: "This month",
      subtitle: `${dash ?? `${analytics?.month?.deliveries ?? 0} deliveries`}`,
      value: dash ?? fmt(analytics?.month?.earnings),
      icon: CalendarDays,
      colorClass:
        "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    },
    {
      title: "All time",
      subtitle: `${dash ?? `${analytics?.allTime?.totalDeliveries ?? 0} deliveries`}`,
      value: dash ?? fmt(analytics?.allTime?.totalEarnings),
      icon: CalendarDays,
      colorClass:
        "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
  ];

  const performanceCards = [
    {
      title: "Acceptance",
      value: dash ?? `${analytics?.allTime?.acceptanceRate ?? 100}%`,
      icon: CircleCheck,
      colorClass:
        "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
      showArrow: false,
    },
    {
      title: "Avg rating",
      value:
        dash ??
        (analytics?.allTime?.averageRating > 0
          ? `${analytics.allTime.averageRating.toFixed(1)} ★`
          : "—"),
      icon: Star,
      colorClass:
        "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
      showArrow: false,
    },
    {
      title: "Successful",
      value: dash ?? analytics?.allTime?.successfulDeliveries ?? 0,
      icon: Truck,
      colorClass:
        "bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400",
      showArrow: false,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {summaryCards.map((card) => (
          <StatCard key={card.title} {...card} showArrow={false} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {periodCards.map((card, i) => (
          <StatCard key={card.title} {...card} showArrow={false} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {performanceCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>
    </div>
  );
}
