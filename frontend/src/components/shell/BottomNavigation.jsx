/**
 * Mobile bottom navigation.
 *
 * Five destinations, no more. It is the primary navigation below `md` and is
 * hidden entirely above it - the desktop header is not a scaled-up version of
 * this, it is a different pattern.
 *
 * The basket deliberately is not a tab: it is contextual, it appears as a
 * sticky action bar when it has contents, and giving it a permanent tab would
 * cost a destination that people use far more often.
 */

import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { Heart, House, ReceiptText, Search, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { transitions } from "@/lib/motion";

const TABS = [
  { to: "/discovery", label: "Home", icon: House, end: true },
  { to: "/search", label: "Search", icon: Search },
  { to: "/orders", label: "Orders", icon: ReceiptText },
  { to: "/favourites", label: "Favourites", icon: Heart },
  { to: "/profile", label: "Profile", icon: User },
];

export function BottomNavigation() {
  return (
    <nav
      aria-label="Primary"
      className={cn(
        "bg-card/95 border-border fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur",
        "pb-[env(safe-area-inset-bottom)] md:hidden",
      )}
    >
      <ul className="grid h-14 grid-cols-5">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="contents">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "relative flex flex-col items-center justify-center gap-0.5",
                  "transition-colors duration-(--duration-standard)",
                  "outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="bottom-nav-active"
                      transition={transitions.springSnappy}
                      aria-hidden="true"
                      className="bg-primary absolute inset-x-5 top-0 h-0.5 rounded-full"
                    />
                  )}
                  <Icon
                    className={cn("size-5 shrink-0", isActive && "fill-primary/15")}
                    aria-hidden="true"
                  />
                  <span className="text-[0.6875rem] leading-none font-medium">{label}</span>
                  {/* The active tab is marked by weight and colour; this tells
                      assistive tech the same thing without relying on either. */}
                  {isActive && <span className="sr-only">(current page)</span>}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
