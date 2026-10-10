import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Gift } from "lucide-react";

import { formatPrice } from "@chowgo/shared/format";
import { isValidReferralCode, normalizeReferralCode, referralRewardsFor } from "@chowgo/shared/referral";
import { storeReferralCode } from "@/lib/referralStorage";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const INVITE_REDIRECT_MS = 6000;

export default function InvitePage() {
  const { t } = useTranslation(["profile", "errors"]);
  const { code: rawCode } = useParams();
  const navigate = useNavigate();
  const signedIn = useAuthStore((state) => Boolean(state.authUser));
  const openAuthModal = useAuthStore((state) => state.openAuthModal);

  const code = normalizeReferralCode(rawCode);
  const valid = isValidReferralCode(code);
  const rewards = useMemo(() => referralRewardsFor(), []);

  useEffect(() => {
    if (valid) storeReferralCode(code);
  }, [valid, code]);

  useEffect(() => {
    const timer = setTimeout(() => navigate("/", { replace: true }), INVITE_REDIRECT_MS);
    return () => clearTimeout(timer);
  }, [navigate]);

  const goOn = () => {
    navigate("/", { replace: true });
    if (valid && !signedIn) openAuthModal(false);
  };

  const money = (amount) => formatPrice(amount, { currency: rewards.currency });

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <Card padded className="w-full max-w-md space-y-4 text-center">
        <Gift className="text-primary mx-auto size-10" aria-hidden="true" />
        {valid ? (
          <>
            <h1 className="text-h1">{t("referral.landingTitle")}</h1>
            <p className="text-body text-muted-foreground">
              {t("referral.landingBody", { amount: money(rewards.friend), min: money(rewards.minSubtotal) })}
            </p>
            <p className="font-mono text-xl font-semibold tracking-[0.2em]">{code}</p>
            {!signedIn && <p className="text-body-sm text-muted-foreground">{t("referral.pending")}</p>}
          </>
        ) : (
          <p role="alert" className="text-body text-destructive">
            {t("errors:referral.invalidCode")}
          </p>
        )}
        <Button block onClick={goOn}>
          {t("referral.landingCta")}
        </Button>
      </Card>
    </div>
  );
}
