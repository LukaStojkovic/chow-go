/**
 * Landing-page proof points.
 *
 * These are marketing figures, not live data - the backend exposes no
 * platform-wide metrics endpoint. Kept as a labelled constant so it is obvious
 * they are copy, and so swapping in a real endpoint is a one-line change.
 */

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Bike, ShoppingBag, Star, Users } from "lucide-react";

import { listItem, staggerContainer } from "@/lib/motion";

// Labels are keys: this array is module scope, so a resolved word would be
// frozen in whichever language loaded first.
const STATS = [
  { value: "4.9", suffix: "/5", labelKey: "stats.rating", icon: Star },
  { value: "2M+", suffix: "", labelKey: "stats.customers", icon: Users },
  { value: "50K+", suffix: "", labelKey: "stats.ordersDaily", icon: ShoppingBag },
  { value: "18", suffix: " min", labelKey: "stats.averageDelivery", icon: Bike },
];

export default function StatsSection() {
  const { t } = useTranslation("landing");

  return (
    <section aria-label={t("stats.sectionLabel")} className="border-border border-y bg-card py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6"
        >
          {STATS.map(({ value, suffix, labelKey, icon: Icon }) => (
            <motion.li
              key={labelKey}
              variants={listItem}
              className="bg-muted flex flex-col items-center justify-center rounded-md p-6 text-center"
            >
              <Icon className="text-primary mb-2 size-6" aria-hidden="true" />
              <p className="text-display text-foreground tabular">
                {value}
                <span className="text-primary text-h1">{suffix}</span>
              </p>
              <p className="text-body-sm text-muted-foreground mt-1">{t(labelKey)}</p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
