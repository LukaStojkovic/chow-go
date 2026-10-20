import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useNow } from "@/hooks/useNow";
import { useRestaurantStatus } from "@/hooks/Restaurants/useRestaurantStatus";
import { RestaurantStatusPanel } from "./RestaurantStatusPanel";
import { TONE, effectiveStatus, statusLabel } from "./statusView";

export function RestaurantStatusControl({ className }) {
  const { t } = useTranslation(["seller", "common"]);
  const [open, setOpen] = useState(false);
  const { data } = useRestaurantStatus();
  const now = useNow(60000, Boolean(data));
  const view = effectiveStatus(data, now);

  if (!view) return null;
  const label = statusLabel(t, view);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        title={t("seller:status.web.change")}
        className={cn(
          "inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5",
          "text-sm font-medium text-foreground shadow-subtle transition-colors hover:bg-muted",
          className,
        )}
      >
        <span className={cn("size-2.5 shrink-0 rounded-full", TONE[view.kind])} aria-hidden="true" />
        <span className="truncate" data-testid="restaurant-status-label">
          {label}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("seller:status.heading")}</DialogTitle>
            <DialogDescription>{label}</DialogDescription>
          </DialogHeader>
          <RestaurantStatusPanel view={view} now={now} />
        </DialogContent>
      </Dialog>
    </>
  );
}
