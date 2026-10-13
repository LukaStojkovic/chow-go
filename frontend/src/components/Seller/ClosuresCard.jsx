import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarOff, Plus, Trash2 } from "lucide-react";
import { CLOSURE_LIMITS, closureOn, normalizeClosures } from "@chowgo/shared/scheduling";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineError } from "@/components/common/StateViews";
import { useRestaurantToday } from "@/hooks/SellerReports/useReportRange";
import { useSaveClosures, useSellerClosures } from "@/hooks/SellerReports/useSellerReports";
import { apiErrorMessage } from "@/lib/apiError";
import { formatDateKey, formatKeyRange } from "@/lib/reportFormat";

function closureMessage(t, { code, max }) {
  switch (code) {
    case "CLOSURE_TOO_LONG":
      return t("errors:closure.tooLong", { max: max ?? CLOSURE_LIMITS.maxDays });
    case "CLOSURE_TOO_FAR":
      return t("errors:closure.tooFar", { max: max ?? CLOSURE_LIMITS.maxDaysAhead });
    case "CLOSURE_TOO_MANY":
      return t("errors:closure.tooMany", { max: max ?? CLOSURE_LIMITS.max });
    case "CLOSURE_REASON":
      return t("errors:closure.reason", { max: max ?? CLOSURE_LIMITS.reasonLength });
    default:
      return t("errors:closure.invalid");
  }
}

const entryKey = (entry) => `${entry.from}:${entry.to}:${entry.reason ?? ""}`;

export function ClosuresCard() {
  const { t } = useTranslation(["seller", "errors"]);
  const fallbackToday = useRestaurantToday();
  const query = useSellerClosures();
  const save = useSaveClosures();
  const today = query.data?.today ?? fallbackToday;
  const closures = query.data?.closures ?? [];
  const [draft, setDraft] = useState({ from: "", to: "", reason: "" });
  const [error, setError] = useState(null);

  const active = closureOn(closures, today);

  const submit = (next, newEntry) => {
    const result = normalizeClosures(next, today);
    if (result.error) {
      const failed = result.error.index !== undefined ? next[result.error.index] : null;
      setError({ key: failed && failed !== newEntry ? entryKey(failed) : "draft", message: closureMessage(t, result.error) });
      return;
    }
    if (newEntry && !result.closures.some((c) => c.from === newEntry.from && c.to === newEntry.to)) {
      setError({ key: "draft", message: closureMessage(t, { code: "CLOSURE_INVALID" }) });
      return;
    }
    setError(null);
    save.mutate(result.closures, {
      onSuccess: () => {
        if (newEntry) setDraft({ from: "", to: "", reason: "" });
      },
      onError: (err) => {
        const index = err?.response?.data?.details?.index;
        const failed = Number.isInteger(index) ? result.closures[index] : null;
        const isDraft = !failed || (newEntry && entryKey(failed) === entryKey({ ...newEntry, reason: newEntry.reason.trim() }));
        setError({ key: isDraft ? "draft" : entryKey(failed), message: apiErrorMessage(err) });
      },
    });
  };

  const add = (event) => {
    event.preventDefault();
    const entry = { from: draft.from, to: draft.to || draft.from, reason: draft.reason };
    submit([...closures, entry], entry);
  };

  const remove = (entry) => submit(closures.filter((c) => c !== entry));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold">{t("closures.title")}</h3>
          {active ? <Badge variant="warning">{t("closures.closedToday")}</Badge> : null}
        </div>
        <CardDescription className="text-sm text-muted-foreground mt-1">{t("closures.hint")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {active ? (
          <p role="status" className="text-sm text-warning">
            {t("closures.reopens", { date: formatDateKey(active.to) })}
          </p>
        ) : null}

        {query.isError ? (
          <InlineError message={t("closures.loadFailed")} onRetry={() => query.refetch()} />
        ) : closures.length === 0 ? (
          <p className="text-sm text-muted-foreground">{query.isLoading ? "" : t("closures.empty")}</p>
        ) : (
          <ul className="divide-y divide-border" aria-label={t("closures.title")}>
            {closures.map((closure) => {
              const range = formatKeyRange(closure.from, closure.to);
              const key = entryKey(closure);
              const isToday = closureOn([closure], today);
              return (
                <li key={key} className="py-3 first:pt-0">
                  <div className="flex items-center gap-3">
                    <CalendarOff className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {range}
                        {isToday ? (
                          <Badge variant="warning" size="sm" className="ml-2">
                            {t("closures.today")}
                          </Badge>
                        ) : null}
                      </p>
                      {closure.reason ? <p className="text-xs text-muted-foreground truncate">{closure.reason}</p> : null}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label={t("closures.remove", { range })}
                      disabled={save.isPending}
                      onClick={() => remove(closure)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                  {error?.key === key ? (
                    <p role="alert" className="text-xs text-destructive mt-1">
                      {error.message}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}

        <form className="space-y-3" onSubmit={add} noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="closure-from">{t("closures.from")}</Label>
              <Input
                id="closure-from"
                type="date"
                min={today}
                value={draft.from}
                onChange={(event) => setDraft((d) => ({ ...d, from: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="closure-to">{t("closures.to")}</Label>
              <Input
                id="closure-to"
                type="date"
                min={draft.from || today}
                value={draft.to}
                onChange={(event) => setDraft((d) => ({ ...d, to: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="closure-reason">{t("closures.reason")}</Label>
              <Input
                id="closure-reason"
                value={draft.reason}
                maxLength={CLOSURE_LIMITS.reasonLength}
                placeholder={t("closures.reasonPlaceholder")}
                onChange={(event) => setDraft((d) => ({ ...d, reason: event.target.value }))}
              />
            </div>
          </div>
          {error?.key === "draft" ? (
            <p role="alert" className="text-sm text-destructive">
              {error.message}
            </p>
          ) : null}
          <Button type="submit" variant="outline" size="sm" disabled={!draft.from} isLoading={save.isPending}>
            <Plus className="size-4" aria-hidden="true" />
            {t("closures.add")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
