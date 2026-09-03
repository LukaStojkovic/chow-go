import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { overlayTransition, transitions } from "@/lib/motion";

/**
 * Side sheet, animated by Framer rather than by CSS keyframes.
 *
 * This is the surface the basket opens in, so it is the animation people see
 * most often in the product. It used to run on Radix's `data-[state]` classes:
 * a 500ms `ease-in-out` slide with a backdrop that faded on a different,
 * shorter curve, so the panel and the dim behind it visibly arrived at
 * different times.
 *
 * Now both ride the same spring, and `AnimatePresence` holds the unmount until
 * the exit finishes. Radix keeps every accessibility guarantee - focus trap,
 * `Escape`, outside press, focus restoration - because `forceMount` + `asChild`
 * only changes who owns the mount timing and the transform.
 *
 * See `ui/dialog.jsx` for the same arrangement and the reason the root has to
 * mirror `open` into context.
 */
const SheetOpenContext = React.createContext(false);

/** Where the sheet rests while closed, per side. */
const OFFSCREEN = {
  right: { x: "100%" },
  left: { x: "-100%" },
  top: { y: "-100%" },
  bottom: { y: "100%" },
};

/**
 * Slide plus fade, with the fade on its own timing.
 *
 * The opacity channel is not decoration. Framer's `reducedMotion="user"`
 * strips transform animation but never opacity, so on a machine with the OS
 * "reduce motion" setting enabled a transform-only sheet does not animate at
 * all - it pops. With opacity in the variant those users get a clean fade
 * instead, and everyone else gets the slide with a fade riding along it.
 */
function sheetVariants(side) {
  const offscreen = OFFSCREEN[side] ?? OFFSCREEN.right;
  const axis = "x" in offscreen ? "x" : "y";

  return {
    hidden: { ...offscreen, opacity: 0 },
    visible: {
      [axis]: 0,
      opacity: 1,
      // Position springs; opacity does not - a spring on opacity overshoots
      // past 1 and clips, which reads as a flicker.
      transition: { ...transitions.spring, opacity: transitions.standard },
    },
    // Leaves on a duration rather than a spring: a spring settling on its way
    // out keeps the panel on screen long after it has stopped being useful.
    exit: { ...offscreen, opacity: 0, transition: transitions.panel },
  };
}

function Sheet({ open, defaultOpen, onOpenChange, ...props }) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(
    defaultOpen ?? false,
  );
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;

  const handleOpenChange = React.useCallback(
    (next) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  return (
    <SheetOpenContext.Provider value={isOpen}>
      <SheetPrimitive.Root
        data-slot="sheet"
        open={isOpen}
        onOpenChange={handleOpenChange}
        {...props}
      />
    </SheetOpenContext.Provider>
  );
}

function SheetTrigger({ ...props }) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({ ...props }) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({ className, ...props }) {
  return (
    <SheetPrimitive.Overlay forceMount asChild {...props}>
      <motion.div
        data-slot="sheet-overlay"
        variants={overlayTransition}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={cn("fixed inset-0 z-50 bg-black/50", className)}
      />
    </SheetPrimitive.Overlay>
  );
}

const SheetContent = React.forwardRef(function SheetContent(
  { className, children, side = "right", showCloseButton = true, ...props },
  ref,
) {
  const open = React.useContext(SheetOpenContext);
  const variants = React.useMemo(() => sheetVariants(side), [side]);

  return (
    <AnimatePresence>
      {open && (
        // AnimatePresence tracks its direct children by key; without one it
        // cannot tell an exiting subtree from a replaced one, and never
        // completes the removal.
        <SheetPortal key="sheet" forceMount>
          <SheetOverlay />
          <SheetPrimitive.Content
            ref={ref}
            forceMount
            asChild
            data-slot="sheet-content"
            {...props}
          >
            <motion.div
              variants={variants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                "bg-background fixed z-50 flex flex-col gap-4 shadow-overlay",
                side === "right" &&
                  "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
                side === "left" &&
                  "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
                side === "top" && "inset-x-0 top-0 h-auto border-b",
                side === "bottom" && "inset-x-0 bottom-0 h-auto border-t",
                className,
              )}
            >
              {children}
              {showCloseButton && (
                <SheetPrimitive.Close
                  className={cn(
                    "ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-xs opacity-70",
                    "transition-opacity duration-(--duration-micro) hover:opacity-100",
                    "focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none",
                  )}
                >
                  <XIcon className="size-4" />
                  <span className="sr-only">Close</span>
                </SheetPrimitive.Close>
              )}
            </motion.div>
          </SheetPrimitive.Content>
        </SheetPortal>
      )}
    </AnimatePresence>
  );
});

function SheetHeader({ className, ...props }) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
};
