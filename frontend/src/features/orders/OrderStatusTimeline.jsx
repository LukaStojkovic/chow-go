/**
 * Live order status.
 *
 * An ordered list, marked up as one, with each step's state carried in text as
 * well as in colour - a completed step says "Done", the current step says
 * "Now". Colour-blind users, greyscale screenshots and screen readers all get
 * the same information.
 *
 * The heading above it is an `aria-live` region so a status change arriving
 * over the socket is announced without the customer having to go looking for
 * what moved.
 */

import { motion } from "framer-motion";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { transitions } from "@/lib/motion";
import { formatTime } from "@/lib/format";

/**
 * @param {Object} props
 * @param {import("@/lib/adapters/types").OrderView} props.order
 */
export function OrderStatusTimeline({ order }) {
  return (
    <div>
      <div className="mb-4">
        <p
          // Polite, not assertive: an order update matters but should not
          // interrupt whatever is being read.
          aria-live="polite"
          aria-atomic="true"
          className="text-h2"
        >
          {order.statusLabel}
        </p>
        <p className="text-body-sm text-muted-foreground mt-0.5">
          {order.statusDescription}
        </p>
      </div>

      <ol className="relative">
        {order.steps.map((step, index) => {
          const isLast = index === order.steps.length - 1;
          const isDone = step.state === "complete";
          const isNow = step.state === "current";

          return (
            <li key={step.id} className="flex gap-3 pb-5 last:pb-0">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                    isDone && "border-primary bg-primary text-primary-foreground",
                    isNow && "border-primary bg-card",
                    !isDone && !isNow && "border-border bg-card",
                  )}
                >
                  {isDone ? (
                    <Check className="size-3.5" aria-hidden="true" />
                  ) : isNow ? (
                    <motion.span
                      // A slow, low-amplitude pulse marking the live step.
                      // Framer removes it under reduced motion, where the
                      // "Now" label carries the state on its own.
                      animate={{ scale: [1, 1.35, 1], opacity: [1, 0.6, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                      className="bg-primary size-2.5 rounded-full"
                      aria-hidden="true"
                    />
                  ) : (
                    <span className="bg-border-strong size-2 rounded-full" aria-hidden="true" />
                  )}
                </span>

                {!isLast && (
                  <motion.span
                    initial={false}
                    animate={{ opacity: 1 }}
                    transition={transitions.standard}
                    className={cn(
                      "mt-1 w-0.5 flex-1 rounded-full",
                      isDone ? "bg-primary" : "bg-border",
                    )}
                    aria-hidden="true"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <p
                    className={cn(
                      "text-label",
                      isDone || isNow ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </p>

                  {/* The state in words, so it never depends on the marker. */}
                  <span
                    className={cn(
                      "text-caption",
                      isNow ? "text-primary font-semibold" : "text-muted-foreground",
                    )}
                  >
                    {isNow ? "Now" : isDone ? "Done" : "Upcoming"}
                  </span>

                  {step.at && (
                    <time
                      dateTime={new Date(step.at).toISOString()}
                      className="text-caption text-muted-foreground tabular ml-auto"
                    >
                      {formatTime(step.at)}
                    </time>
                  )}
                </div>

                {isNow && (
                  <p className="text-body-sm text-muted-foreground mt-0.5">
                    {step.description}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
