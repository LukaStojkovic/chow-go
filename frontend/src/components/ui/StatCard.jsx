import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export const StatCard = ({
  title,
  subtitle,
  value,
  trend,
  isPositive,
  icon: Icon,
  colorClass,
  showArrow = true,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="text-sm font-medium text-muted-foreground ">
          {title}
        </p>
        <h3 className="text-3xl font-bold mt-2 text-foreground tracking-tight">
          {value}
        </h3>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground ">
            {subtitle}
          </p>
        )}
      </div>
      {Icon && (
        <div className={`p-3 rounded-xl ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
    <div className="flex items-center gap-2 text-sm font-medium">
      {showArrow && (
        <>
          <span
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
              isPositive
                ? "bg-primary-subtle text-primary "
                : "bg-destructive-subtle text-destructive "
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
            {trend}
          </span>
          <span className="text-muted-foreground">vs last month</span>
        </>
      )}
    </div>
  </motion.div>
);
