/**
 * Shared motion presets.
 *
 * Motion in this product exists to explain space and confirm actions, never to
 * decorate. Four durations and one easing, matching the CSS tokens in
 * `index.css`, so a sheet opening feels like the same product as a toast
 * arriving.
 *
 * The values here are deliberately unhurried. An earlier pass ran everything at
 * 120-200ms with 6-8px throws, which measured well and felt mechanical - the
 * movement was over before the eye registered it had started. Entry animations
 * travel far enough to be read (16-20px) and cards lift on a spring, which is
 * what makes a hover feel like it has weight rather than like a state flip.
 *
 * Reduced motion is handled globally by `<MotionConfig reducedMotion="user">`
 * in `App.jsx`: Framer strips transform and layout animation for those users
 * while keeping opacity, so every state change stays perceivable. Components
 * should not branch on `useReducedMotion()` themselves unless they animate
 * something Framer cannot neutralise (an auto-scroll, for instance).
 */

/** Durations in seconds, mirroring the `--duration-*` CSS tokens. */
export const DURATION = {
  micro: 0.15,
  standard: 0.25,
  panel: 0.34,
  page: 0.3,
  /** Photography only, mirroring `--duration-image`. */
  image: 0.5,
};

/**
 * Matches `--ease-standard`: a long, flat tail. Movement decelerates almost to
 * a stop well before it ends, which is what reads as "smooth" rather than
 * "fast then stopped".
 */
export const EASE = [0.22, 1, 0.36, 1];

export const transitions = {
  micro: { duration: DURATION.micro, ease: EASE },
  standard: { duration: DURATION.standard, ease: EASE },
  panel: { duration: DURATION.panel, ease: EASE },
  page: { duration: DURATION.page, ease: EASE },
  /**
   * Overlay surfaces: sheets, the basket panel, bottom sheets.
   * Critically damped enough not to wobble, loose enough to have weight.
   */
  spring: { type: "spring", stiffness: 320, damping: 34, mass: 0.9 },
  /** Softer, bouncier - hover lifts and press feedback on cards. */
  springSoft: { type: "spring", stiffness: 260, damping: 22, mass: 0.7 },
  /** Snappy, for small controls: chips, icon buttons, steppers. */
  springSnappy: { type: "spring", stiffness: 420, damping: 26, mass: 0.5 },
};

/** Content that should appear without implying direction. */
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.standard },
  exit: { opacity: 0, transition: transitions.micro },
};

/** Page and section content entering from below. */
export const slideUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: transitions.page },
  exit: { opacity: 0, y: 8, transition: transitions.micro },
};

/** Popovers, tooltips and badges that grow from their trigger. */
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: transitions.standard },
  exit: { opacity: 0, scale: 0.97, transition: transitions.micro },
};

/** One item in a staggered list. Pair with `staggerContainer`. */
export const listItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: transitions.page },
  exit: { opacity: 0, transition: transitions.micro },
};

/**
 * Stagger children into view.
 *
 * 50ms per child with a 12-card grid finishes in 0.6s. Children are
 * interactive from their first frame - the animation never gates a click.
 */
export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.03 },
  },
};

/** Desktop dialog. */
export const dialogTransition = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: transitions.panel },
  exit: { opacity: 0, scale: 0.98, transition: transitions.micro },
};

/**
 * Backdrop behind any overlay surface.
 *
 * Matched to the panel it sits behind: a backdrop that fades in over 150ms
 * while the sheet takes 340ms to arrive is the single most common reason an
 * overlay feels cheap.
 */
export const overlayTransition = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.panel },
  exit: { opacity: 0, transition: transitions.standard },
};

/**
 * Route content entering.
 *
 * Enters on the standard page duration and leaves fast: the exit is dead time
 * before the next screen can start, so it is kept to a frame or four. Paired
 * with `AnimatePresence mode="wait"`, which is what stops the two screens from
 * being briefly stacked on top of each other.
 */
export const pageTransition = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: transitions.page },
  exit: { opacity: 0, y: -6, transition: { duration: 0.14, ease: EASE } },
};

/**
 * Press feedback for cards and custom buttons.
 * Framer neutralises `scale` under reduced motion, so this needs no guard.
 */
export const pressable = {
  whileTap: { scale: 0.98 },
  transition: transitions.springSoft,
};

/**
 * The hover lift shared by every card in the product.
 *
 * Spread onto a `motion.*` element. Pairs with `.surface-interactive` in
 * `index.css`, which carries the shadow and border half of the same gesture -
 * transform on the spring, colour on a CSS transition, because springing a
 * box-shadow is expensive and springing a colour looks wrong.
 */
export const hoverLift = {
  whileHover: { y: -4 },
  whileTap: { scale: 0.99 },
  transition: transitions.springSoft,
};

/**
 * The hover gesture for small controls - category chips, rail tiles, avatars.
 * A shorter throw than `hoverLift`, because a 56px tile rising 4px looks like
 * it came loose.
 */
export const hoverNudge = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.94 },
  transition: transitions.springSnappy,
};
