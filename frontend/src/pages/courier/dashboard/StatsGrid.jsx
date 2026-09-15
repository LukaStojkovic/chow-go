import React from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["courier", "common"]);
  const fmt = (n) => (n != null ? `$${n.toFixed(2)}` : "—");
  const dash = isLoading ? "—" : null;

  const summaryCards = [
    {
      title: t("dashboard.earnedToday"),
      value: dash ?? fmt(analytics?.today?.earnings),
      icon: DollarSign,
      colorClass:
        "bg-primary-subtle text-primary ",
    },
    {
      title: t("dashboard.deliveries"),
      subtitle: t("dashboard.today"),
      value: dash ?? analytics?.today?.deliveries ?? 0,
      icon: Truck,
      colorClass:
        "bg-primary-subtle text-primary ",
    },
    {
      title: t("dashboard.averageTime"),
      subtitle: t("dashboard.perDelivery"),
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
      title: t("dashboard.week"),
      subtitle:
        dash ?? t("dashboard.deliveryCount", { count: analytics?.week?.deliveries ?? 0 }),
      value: dash ?? fmt(analytics?.week?.earnings),
      icon: CalendarDays,
      colorClass:
        "bg-info-subtle text-info ",
    },
    {
      title: t("dashboard.month"),
      subtitle:
        dash ?? t("dashboard.deliveryCount", { count: analytics?.month?.deliveries ?? 0 }),
      value: dash ?? fmt(analytics?.month?.earnings),
      icon: CalendarDays,
      colorClass:
        "bg-warning-subtle text-warning ",
    },
    {
      title: t("dashboard.allTime"),
      subtitle:
        dash ??
        t("dashboard.deliveryCount", { count: analytics?.allTime?.totalDeliveries ?? 0 }),
      value: dash ?? fmt(analytics?.allTime?.totalEarnings),
      icon: CalendarDays,
      colorClass:
        "bg-primary-subtle text-primary ",
    },
  ];

  const performanceCards = [
    {
      title: t("dashboard.acceptanceRate"),
      value: dash ?? `${analytics?.allTime?.acceptanceRate ?? 100}%`,
      icon: CircleCheck,
      colorClass:
        "bg-primary-subtle text-primary ",
      showArrow: false,
    },
    {
      title: t("dashboard.rating"),
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
      title: t("profile.successful"),
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
