import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  showCloseButton = true,
  className,
}) {
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className={cn(
            "bg-white/95 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-0 overflow-hidden",
            sizeClasses[size],
            className
          )}
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.15 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 -z-10"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-green-400 to-emerald-500 rounded-full blur-3xl" />
          </motion.div>

          {(title || description || showCloseButton) && (
            <DialogHeader className="p-8 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  {title && (
                    <DialogTitle className="text-2xl font-bold bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {title}
                    </DialogTitle>
                  )}
                  {description && (
                    <DialogDescription className="text-gray-600 mt-2">
                      {description}
                    </DialogDescription>
                  )}
                </div>
              </div>
            </DialogHeader>
          )}

          <div className="px-8 pb-8">{children}</div>

          {footer && (
            <DialogFooter className="px-8 pb-8 pt-4">{footer}</DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
