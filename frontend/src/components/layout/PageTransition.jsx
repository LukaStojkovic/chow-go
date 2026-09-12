/**
 * Route content transition.
 *
 * Screens used to appear instantly, which reads less as "fast" and more as
 * "the page broke and re-rendered" - there is nothing to tell you a navigation
 * happened, so the eye has to re-find its place from scratch. A short rise and
 * fade gives the change a direction.
 *
 * `useOutlet()` rather than `<Outlet />`: `AnimatePresence` keeps the outgoing
 * subtree mounted while it exits, and a retained `<Outlet />` element resolves
 * against the *new* route context, so the screen being animated out would
 * already have swapped to the incoming one. `useOutlet` resolves the element
 * once, at render, which is what makes the exit show the screen you just left.
 *
 * `mode="wait"` stops the two screens from being briefly stacked; the exit is
 * 140ms, which is the whole cost of the effect.
 *
 * The Suspense boundary belongs here, inside the layout, rather than around the
 * whole `<Routes>`: a lazy route chunk then suspends only the content column,
 * so the sidebar and header stay put and `fallback` can be a skeleton shaped
 * like the screen being opened. Keying it by pathname gives each navigation its
 * own boundary, which is what makes the fallback appear at all.
 */

import { Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useOutlet } from "react-router-dom";

import { pageTransition } from "@/lib/motion";

/**
 * @param {Object} props
 * @param {unknown} [props.context] Forwarded to `useOutlet`, for layouts that
 *   pass data down through `<Outlet context={...} />`.
 * @param {React.ReactNode} [props.fallback] Rendered while the route chunk loads.
 * @param {string} [props.className]
 */
export function PageTransition({ context, fallback = null, className }) {
  const outlet = useOutlet(context);
  const { pathname } = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={pageTransition}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={className}
      >
        <Suspense fallback={fallback}>{outlet}</Suspense>
      </motion.div>
    </AnimatePresence>
  );
}
