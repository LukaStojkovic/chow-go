import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const ALL = "__all";

export function ListToolbar({ statuses, status, onStatus, onSearch, statusLabel }) {
  const { t } = useTranslation("admin");
  const [draft, setDraft] = useState("");

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(draft.trim());
      }}
    >
      {statuses ? (
        <Select value={status || ALL} onValueChange={(value) => onStatus(value === ALL ? "" : value)}>
          <SelectTrigger className="sm:w-56" aria-label={t("columns.status")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("filters.all")}</SelectItem>
            {statuses.map((value) => (
              <SelectItem key={value} value={value}>
                {statusLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      <Input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={t("filters.search")}
        aria-label={t("filters.search")}
        className="sm:max-w-sm"
      />
    </form>
  );
}

export function Pager({ pagination, onPage }) {
  const { t } = useTranslation("admin");
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages } = pagination;

  return (
    <div className="flex items-center justify-end gap-2 pt-2 text-body-sm text-muted-foreground">
      <span>{t("page", { page, pages })}</span>
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        {t("previous")}
      </Button>
      <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        {t("next")}
      </Button>
    </div>
  );
}

/**
 * Every admin action goes through this, so the reason lands in the audit log
 * next to who did it. `request` is `{ title, required, run }` or null.
 */
export function ReasonDialog({ request, onClose, isPending }) {
  const { t } = useTranslation("admin");
  const [reason, setReason] = useState("");
  const missing = request?.required && !reason.trim();

  const close = () => {
    setReason("");
    onClose();
  };

  return (
    <Dialog open={Boolean(request)} onOpenChange={(open) => !open && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{request?.title}</DialogTitle>
          <DialogDescription>
            {request?.required ? t("reason.required") : t("reason.optional")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="admin-reason">{t("reason.label")}</Label>
          <Textarea
            id="admin-reason"
            value={reason}
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t("reason.placeholder")}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={close}>
            {t("reason.cancel")}
          </Button>
          <Button
            variant={request?.destructive ? "destructive" : "default"}
            disabled={missing || isPending}
            onClick={async () => {
              // A refusal is already toasted; keep the dialog so the reason survives.
              try {
                await request.run(reason.trim());
                close();
              } catch {
                /* shown by the mutation's onError */
              }
            }}
          >
            {t("reason.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
