import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Gift, Link2, Share2 } from "lucide-react";
import { toast } from "sonner";

import { formatPrice } from "@chowgo/shared/format";
import { normalizeReferralCode, referralLink } from "@chowgo/shared/referral";
import { apiErrorMessage } from "@/lib/apiError";
import { copyText } from "@/lib/clipboard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplyReferralCode, useMyReferral } from "@/hooks/Referral/useReferral";

export function ReferralCard() {
  const { t } = useTranslation(["profile", "errors"]);
  const { data: referral, isLoading, isError } = useMyReferral();
  const applyCode = useApplyReferralCode();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState(null);

  if (isError) return null;

  if (isLoading || !referral) {
    return (
      <Card padded className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-14 w-full rounded-md" />
      </Card>
    );
  }

  const { code, rewards, stats, appliedCode, canApplyCode } = referral;
  const money = (amount) => formatPrice(amount, { currency: rewards.currency });
  const link = referralLink(window.location.origin, code);

  const copy = async (text) => {
    if (await copyText(text)) toast.success(t("referral.copied"));
    else toast.info(text);
  };

  const share = async () => {
    const text = t("referral.shareMessage", { amount: money(rewards.friend), code, link });
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text });
      } catch (err) {
        if (err?.name !== "AbortError") copy(link);
      }
      return;
    }
    copy(link);
  };

  const submit = (event) => {
    event.preventDefault();
    const value = normalizeReferralCode(draft);
    if (!value) return;
    setError(null);
    applyCode.mutate(value, {
      onSuccess: (result) => {
        setDraft("");
        const friendRewards = result?.rewards ?? rewards;
        toast.success(
          t("referral.applied", {
            amount: formatPrice(friendRewards.friend, { currency: friendRewards.currency }),
          }),
        );
      },
      onError: (err) => setError(apiErrorMessage(err, { fallbackKey: "errors:referral.invalidCode" })),
    });
  };

  return (
    <Card padded className="space-y-4">
      <div className="flex items-start gap-3">
        <Gift className="text-primary mt-1 size-5 shrink-0" aria-hidden="true" />
        <div>
          <h2 className="text-h2">{t("referral.title")}</h2>
          <p className="text-body-sm text-muted-foreground">
            {t("referral.hint", {
              friend: money(rewards.friend),
              min: money(rewards.minSubtotal),
              referrer: money(rewards.referrer),
            })}
          </p>
        </div>
      </div>

      <div className="bg-muted rounded-md p-3 text-center">
        <p className="text-caption text-muted-foreground">{t("referral.yourCode")}</p>
        <p className="font-mono text-2xl font-semibold tracking-[0.2em]" data-testid="referral-code">
          {code}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Button type="button" variant="outline" size="sm" onClick={() => copy(code)}>
          <Copy aria-hidden="true" />
          {t("referral.copy")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => copy(link)}>
          <Link2 aria-hidden="true" />
          {t("referral.copyLink")}
        </Button>
        <Button type="button" size="sm" onClick={share}>
          <Share2 aria-hidden="true" />
          {t("referral.share")}
        </Button>
      </div>

      <p className="text-body-sm text-muted-foreground">
        {t("referral.invited", { count: stats?.invited ?? 0 })}
        {" · "}
        {t("referral.rewarded", { count: stats?.rewarded ?? 0 })}
      </p>

      {appliedCode ? (
        <p className="text-body-sm border-border border-t pt-3">
          {t("referral.appliedCode", { code: appliedCode })}
        </p>
      ) : canApplyCode ? (
        <div className="border-border space-y-2 border-t pt-3">
          <p className="text-label">{t("referral.haveCode")}</p>
          <form className="flex gap-2" onSubmit={submit}>
            <Label htmlFor="referral-code-input" className="sr-only">
              {t("referral.enterCode")}
            </Label>
            <Input
              id="referral-code-input"
              value={draft}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={16}
              placeholder={t("referral.enterCodePlaceholder")}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "referral-code-error" : undefined}
              onChange={(event) => {
                setDraft(event.target.value.toUpperCase());
                if (error) setError(null);
              }}
              className="h-9 font-mono uppercase"
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="h-9"
              disabled={!draft.trim()}
              isLoading={applyCode.isPending}
            >
              {t("referral.apply")}
            </Button>
          </form>
          {error && (
            <p id="referral-code-error" role="alert" className="text-caption text-destructive">
              {error}
            </p>
          )}
        </div>
      ) : null}
    </Card>
  );
}
