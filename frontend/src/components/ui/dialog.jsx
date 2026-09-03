import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { dialogTransition, overlayTransition } from "@/lib/motion";

/**
 * Dialog, animated by Framer rather than by CSS keyframes.
 *
 * Radix drives its own enter/exit with `data-[state]` classes, which give you a
 * fixed cubic-bezier and no way to share easing with the rest of the product -
 * the reason overlays here used to feel unrelated to everything else on screen.
 *
 * The fix is the standard Radix + Framer arrangement: `forceMount` hands
 * mount/unmount control to `AnimatePresence`, which runs our own variants and
 * only lets Radix unmount once the exit animation has finished. Every
 * accessibility guarantee is untouched - the focus trap, `Escape`, outside
 * press, `aria-modal`, and focus restoration are all still Radix's.
 *
 * `forceMount` needs to know whether the dialog is open, and Radix does not
 * expose that, so the root mirrors it into context. Controlled and uncontrolled
 * use both work.
 */
const DialogOpenContext = React.createContext(false);

function Dialog({ open, defaultOpen, onOpenChange, ...props }) {
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
    <DialogOpenContext.Provider value={isOpen}>
      <DialogPrimitive.Root
        data-slot="dialog"
        open={isOpen}
        onOpenChange={handleOpenChange}
        {...props}
      />
    </DialogOpenContext.Provider>
  );
}

function DialogTrigger({ ...props }) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({ className, ...props }) {
  return (
    <DialogPrimitive.Overlay forceMount asChild {...props}>
      <motion.div
        data-slot="dialog-overlay"
        variants={overlayTransition}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={cn("fixed inset-0 z-50 bg-black/50", className)}
      />
    </DialogPrimitive.Overlay>
  );
}

const DialogContent = React.forwardRef(function DialogContent(
  { className, children, showCloseButton = true, ...props },
  ref,
) {
  const open = React.useContext(DialogOpenContext);

  return (
    <AnimatePresence>
      {open && (
        <DialogPortal key="dialog" forceMount data-slot="dialog-portal">
          <DialogOverlay />

          {/* Centring lives on this wrapper rather than on the panel itself.
              The old `top-1/2 -translate-y-1/2` centring wrote to the same
              transform Framer needs for the enter animation, and the two
              cannot both own it. `pointer-events-none` keeps outside clicks
              reaching the overlay, which is what dismisses the dialog. */}
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
            <DialogPrimitive.Content
              ref={ref}
              forceMount
              asChild
              data-slot="dialog-content"
              {...props}
            >
              <motion.div
                variants={dialogTransition}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={cn(
                  "bg-background pointer-events-auto relative grid w-full max-w-lg gap-4",
                  "max-h-[calc(100dvh-2rem)] rounded-md border p-6 shadow-overlay",
                  className,
                )}
              >
                {children}
                {showCloseButton && (
                  <DialogPrimitive.Close
                    data-slot="dialog-close"
                    className={cn(
                      "ring-offset-background focus:ring-ring absolute top-4 right-4 cursor-pointer rounded-xs opacity-70",
                      "transition-opacity duration-(--duration-micro) hover:opacity-100",
                      "focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none",
                      "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                    )}
                  >
                    <XIcon />
                    <span className="sr-only">Close</span>
                  </DialogPrimitive.Close>
                )}
              </motion.div>
            </DialogPrimitive.Content>
          </div>
        </DialogPortal>
      )}
    </AnimatePresence>
  );
});

function DialogHeader({ className, ...props }) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
