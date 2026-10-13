import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
import { RANGE_PRESETS, REPORT_LIMITS, parseReportRange } from "@chowgo/shared/reportRange";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatKeyRange } from "@/lib/reportFormat";

function rangeError(t, error) {
  if (!error) return null;
  if (error.code === "REPORT_RANGE_TOO_LONG") {
    return t("errors:report.rangeTooLong", { max: error.max ?? REPORT_LIMITS.maxDays });
  }
  return t("errors:report.rangeInvalid");
}

export function RangePicker({ range, selected, todayKey, onPreset, onCustom, onExport, isExporting }) {
  const { t } = useTranslation(["seller", "errors"]);
  const [showCustom, setShowCustom] = useState(selected === "custom");
  const [draft, setDraft] = useState({ from: range.from, to: range.to });
  const [error, setError] = useState(null);

  const apply = (event) => {
    event.preventDefault();
    const result = parseReportRange(draft, todayKey);
    if (result.error) {
      setError(rangeError(t, result.error));
      return;
    }
    setError(null);
    onCustom({ from: result.range.from, to: result.range.to });
  };

  const choosePreset = (preset) => {
    setShowCustom(false);
    setError(null);
    onPreset(preset);
  };

  const custom = showCustom || selected === "custom";

  return (
    <div className="bg-card p-4 sm:p-5 rounded-3xl border border-border space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground mr-1">{t("reports.range.label")}</span>
        {RANGE_PRESETS.map((preset) => {
          const active = !custom && selected === preset;
          return (
            <Button
              key={preset}
              size="sm"
              variant={active ? "primary" : "outline"}
              aria-pressed={active}
              onClick={() => choosePreset(preset)}
            >
              {t(`reports.range.presets.${preset}`)}
            </Button>
          );
        })}
        <Button
          size="sm"
          variant={custom ? "primary" : "outline"}
          aria-pressed={custom}
          onClick={() => {
            setDraft({ from: range.from, to: range.to });
            setShowCustom(true);
          }}
        >
          {t("reports.range.presets.custom")}
        </Button>
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={onExport} isLoading={isExporting}>
          <Download className="size-4" aria-hidden="true" />
          {t("reports.export.button")}
        </Button>
      </div>

      {custom && (
        <form className="flex flex-col sm:flex-row sm:items-end gap-3" onSubmit={apply} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="report-from">{t("reports.range.from")}</Label>
            <Input
              id="report-from"
              type="date"
              max={todayKey}
              value={draft.from}
              onChange={(event) => setDraft((d) => ({ ...d, from: event.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="report-to">{t("reports.range.to")}</Label>
            <Input
              id="report-to"
              type="date"
              max={todayKey}
              value={draft.to}
              onChange={(event) => setDraft((d) => ({ ...d, to: event.target.value }))}
            />
          </div>
          <Button type="submit" size="sm" className="sm:mb-0.5">
            {t("reports.range.apply")}
          </Button>
        </form>
      )}

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">{formatKeyRange(range.from, range.to)}</p>
      )}
    </div>
  );
}
