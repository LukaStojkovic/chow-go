export const DURATION = {
  micro: 0.15,
  standard: 0.25,
  panel: 0.34,
  page: 0.3,
  image: 0.5,
};

export const EASE = [0.22, 1, 0.36, 1];

export const transitions = {
  micro: { duration: DURATION.micro, ease: EASE },
  standard: { duration: DURATION.standard, ease: EASE },
  panel: { duration: DURATION.panel, ease: EASE },
  page: { duration: DURATION.page, ease: EASE },
  spring: { type: "spring", stiffness: 320, damping: 34, mass: 0.9 },
  springSoft: { type: "spring", stiffness: 260, damping: 22, mass: 0.7 },
  springSnappy: { type: "spring", stiffness: 420, damping: 26, mass: 0.5 },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.standard },
  exit: { opacity: 0, transition: transitions.micro },
};

export const slideUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: transitions.page },
  exit: { opacity: 0, y: 8, transition: transitions.micro },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: transitions.standard },
  exit: { opacity: 0, scale: 0.97, transition: transitions.micro },
};

export const listItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: transitions.page },
  exit: { opacity: 0, transition: transitions.micro },
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.03 },
  },
};

export const dialogTransition = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: transitions.panel },
  exit: { opacity: 0, scale: 0.98, transition: transitions.micro },
};

export const overlayTransition = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.panel },
  exit: { opacity: 0, transition: transitions.standard },
};

export const pageTransition = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: transitions.page },
  exit: { opacity: 0, y: -6, transition: { duration: 0.14, ease: EASE } },
};

export const pressable = {
  whileTap: { scale: 0.98 },
  transition: transitions.springSoft,
};

export const hoverLift = {
  whileHover: { y: -4 },
  whileTap: { scale: 0.99 },
  transition: transitions.springSoft,
};

export const hoverNudge = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.94 },
  transition: transitions.springSnappy,
};
