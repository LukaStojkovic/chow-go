/**
 * One overlay, two presentations.
 *
 * A bottom sheet is the right surface on a phone - it opens near the thumb,
 * it can be dismissed with a downward drag, and it does not cover the whole
 * screen. On a pointer device a centred dialog is right instead. Both are
 * modal, both trap focus, both restore focus to the trigger on close, and both
 * close on Escape, so the interaction contract is identical.
 *
 * Callers pass one set of children and get the correct surface for the device.
 */

import { useRef } from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

/**
 * @param {Object} props
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {string} props.title Always rendered - a modal without an accessible
 *   name is announced as "dialog" and nothing else.
 * @param {string} [props.description]
 * @param {boolean} [props.hideHeader] Hides the title visually but keeps it
 *   available to assistive technology, for surfaces with their own hero.
 * @param {React.ReactNode} [props.footer] Pinned below the scrolling body.
 */
export function ResponsiveSheet({
  open,
  onOpenChange,
  title,
  description,
  hideHeader = false,
  footer,
  className,
  children,
}) {
  const isMobile = useIsMobile();
  const contentRef = useRef(null);

  /**
   * Radix focuses the first focusable descendant on open. When that happens to
   * be a textarea, a phone opens its keyboard over the sheet the instant it
   * appears. Focus goes to the surface itself instead: still inside the focus
   * trap, still the first Tab stop, but nothing is typed into by accident.
   */
  const handleOpenAutoFocus = (event) => {
    event.preventDefault();
    contentRef.current?.focus();
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
        <DrawerContent
          ref={contentRef}
          tabIndex={-1}
          onOpenAutoFocus={handleOpenAutoFocus}
          className={cn("max-h-[92dvh] outline-none", className)}
        >
          <DrawerHeader className={cn("text-left", hideHeader && "sr-only")}>
            <DrawerTitle className="text-h2">{title}</DrawerTitle>
            {description ? (
              <DrawerDescription>{description}</DrawerDescription>
            ) : (
              <DrawerDescription className="sr-only">{title}</DrawerDescription>
            )}
          </DrawerHeader>

          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

          {footer && (
            <div className="border-border bg-card border-t p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {footer}
            </div>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={contentRef}
        tabIndex={-1}
        onOpenAutoFocus={handleOpenAutoFocus}
        className={cn(
          "flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 outline-none sm:max-w-lg",
          className,
        )}
      >
        <DialogHeader className={cn("px-5 pt-5", hideHeader && "sr-only")}>
          <DialogTitle className="text-h2">{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : (
            <DialogDescription className="sr-only">{title}</DialogDescription>
          )}
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

        {footer && <div className="border-border bg-card border-t p-5">{footer}</div>}
      </DialogContent>
    </Dialog>
  );
}
