import { useEffect, useState } from "react";

/**
 * Whether this person wants animation, and how much.
 *
 * The operating system answers this via `prefers-reduced-motion`, but this
 * product does not follow it by default. That is a deliberate product decision,
 * not an oversight: on Windows the flag is part of a general "visual effects"
 * setting that people switch off for performance or battery, and it then reads
 * as "this app is broken" rather than as a considered accommodation.
 *
 * Anyone who does want the OS respected has two ways to say so, and both are
 * one control away in Profile > Appearance.
 *
 * Three values, mirroring the theme control:
 *   full     animate regardless of the OS setting (the default)
 *   reduced  no movement, regardless of the OS setting
 *   system   follow `prefers-reduced-motion`
 *
 * Two consumers:
 *   - `<MotionConfig reducedMotion>` in App.jsx, for every Framer variant.
 *   - `<html data-motion>`, which `index.css` reads for the CSS-driven half.
 * Both have to agree, which is why this hook owns the attribute rather than
 * leaving it to whoever renders the settings control.
 */

const STORAGE_KEY = "motion";
const VALUES = ["full", "reduced", "system"];

/** `reducedMotion` values understood by Framer's `MotionConfig`. */
const FRAMER_VALUE = {
  full: "never",
  reduced: "always",
  system: "user",
};

function readStored() {
  if (typeof window === "undefined") return "full";
  const saved = localStorage.getItem(STORAGE_KEY);
  // Must stay in step with the pre-paint script in index.html.
  return VALUES.includes(saved) ? saved : "full";
}

function systemPrefersReduced() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useMotionPreference() {
  const [preference, setPreference] = useState(readStored);
  const [systemReduced, setSystemReduced] = useState(systemPrefersReduced);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (event) => setSystemReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, preference);

    // `full` and `reduced` are stamped so the CSS can act on an explicit
    // choice; `system` clears the attribute and lets the media query in
    // `index.css` decide, which is also the correct state before this effect
    // has run for the first time.
    const root = document.documentElement;
    if (preference === "system") {
      root.removeAttribute("data-motion");
    } else {
      root.setAttribute("data-motion", preference);
    }
  }, [preference]);

  const isReduced =
    preference === "reduced" || (preference === "system" && systemReduced);

  return {
    preference,
    setPreference,
    /** Pass straight to `<MotionConfig reducedMotion={...}>`. */
    framerValue: FRAMER_VALUE[preference],
    /** True when motion is currently suppressed, whatever the reason. */
    isReduced,
    /** True when the OS asked for reduced motion, regardless of the override. */
    systemReduced,
  };
}
