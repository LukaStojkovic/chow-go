import { motion } from "framer-motion";
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-white/40 dark:border-zinc-800/60 shadow-2xl rounded-2xl sm:rounded-3xl p-0 overflow-hidden",
          sizeClasses[size],
          className
        )}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="absolute inset-0 -z-10 pointer-events-none"
        >
          <div className="absolute top-0 right-0 w-64 sm:w-72 h-64 sm:h-72 bg-linear-to-br from-emerald-500/20 to-emerald-600/10 dark:from-emerald-500/10 dark:to-emerald-600/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-56 sm:w-64 h-56 sm:h-64 bg-linear-to-tr from-emerald-500/15 to-teal-600/5 dark:from-emerald-500/8 dark:to-teal-600/3 rounded-full blur-3xl" />
        </motion.div>

        {(title || description || showCloseButton) && (
          <DialogHeader className="p-4 sm:p-6 md:p-8 pb-3 sm:pb-4">
            <div className="flex justify-between items-start w-full">
              <div className="flex-1">
                {title && (
                  <DialogTitle className="text-xl sm:text-2xl font-bold bg-linear-to-r from-emerald-600 to-emerald-600 dark:from-emerald-400 dark:to-emerald-400 bg-clip-text text-transparent">
                    {title}
                  </DialogTitle>
                )}
                {description && (
                  <DialogDescription className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
                    {description}
                  </DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>
        )}

        <div className="px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8 relative z-10">
          {children}
        </div>

        {footer && (
          <DialogFooter className="px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8 pt-3 sm:pt-4 border-t border-gray-200/50 dark:border-zinc-800/50">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
