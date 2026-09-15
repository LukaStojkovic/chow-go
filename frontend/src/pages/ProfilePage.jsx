/**
 * Profile and settings.
 *
 * Two columns on desktop, one on mobile, ordered by how often each block is
 * actually used: details, addresses, then preferences and support. Signing out
 * and any other destructive action are separated at the bottom, past a divider,
 * and confirmed.
 *
 * Payment methods are not here: the backend stores no cards - `paymentMethod`
 * on an order is a `cash | card | wallet` enum chosen at checkout, and there is
 * no vault or provider integration. A "Payment methods" section would be a
 * screen that cannot do anything.
 */

import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Bell,
  ChevronRight,
  Heart,
  KeyRound,
  LifeBuoy,
  LogOut,
  Monitor,
  Moon,
  Package,
  Sparkles,
  Sun,
  Waves,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useMotionPreference } from "@/hooks/useMotionPreference";

import { PageContainer, Stack } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import PasswordChangeModal from "@/components/Profile/PasswordChangeModal";
import { PersonalDetailsCard } from "@/features/profile/PersonalDetailsCard";
import { SavedAddressesCard } from "@/features/profile/SavedAddressesCard";
import { DeleteAccountDialog } from "@/components/Profile/DeleteAccountDialog";

// Keys, not copy: module scope runs before a language is chosen.
const THEMES = [
  { value: "light", labelKey: "preferences.themeLight", icon: Sun },
  { value: "dark", labelKey: "preferences.themeDark", icon: Moon },
  { value: "system", labelKey: "preferences.themeSystem", icon: Monitor },
];

const MOTION_OPTIONS = [
  { value: "full", labelKey: "preferences.motionFull", icon: Waves },
  { value: "reduced", labelKey: "preferences.motionReduced", icon: Sparkles },
  { value: "system", labelKey: "preferences.themeSystem", icon: Monitor },
];

/** A row that navigates somewhere. */
function LinkRow({ to, icon: Icon, label, description }) {
  return (
    <Link
      to={to}
      className={cn(
        "hover:bg-muted flex items-center gap-3 rounded-sm px-3 py-3",
        "outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
      )}
    >
      <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="text-label text-foreground block">{label}</span>
        {description && (
          <span className="text-body-sm text-muted-foreground block">{description}</span>
        )}
      </span>
      <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
    </Link>
  );
}

export default function ProfilePage() {
  const { t } = useTranslation(["profile", "common", "order"]);
  const { authUser, logout } = useAuthStore();
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const { theme, setTheme } = useDarkMode();
  const { preference: motion, setPreference: setMotion, systemReduced } =
    useMotionPreference();
  const [showSignOut, setShowSignOut] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  return (
    <PageContainer width="reading" className="py-6">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Stack gap="lg">
          <PersonalDetailsCard />
          <SavedAddressesCard />
        </Stack>

        <Stack gap="lg">
          <Card padded className="space-y-3">
            <h2 className="text-h2">{t("preferences.theme")}</h2>

            <fieldset>
              <legend className="sr-only">{t("preferences.chooseTheme")}</legend>
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map(({ value, labelKey, icon: Icon }) => {
                  const isActive = theme === value;
                  return (
                    <label
                      key={value}
                      htmlFor={`theme-${value}`}
                      className={cn(
                        "flex cursor-pointer flex-col items-center gap-1.5 rounded-md border p-3",
                        "transition-colors duration-(--duration-micro) ease-(--ease-standard)",
                        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                        isActive
                          ? "border-primary bg-primary-subtle text-primary-subtle-foreground"
                          : "border-border text-muted-foreground hover:border-border-strong",
                      )}
                    >
                      <input
                        type="radio"
                        id={`theme-${value}`}
                        name="theme"
                        checked={isActive}
                        onChange={() => setTheme(value)}
                        className="sr-only"
                      />
                      <Icon className="size-5" aria-hidden="true" />
                      <span className="text-label">{t(labelKey)}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-label text-foreground mb-1">
                {t("preferences.motion")}
              </legend>
              <p className="text-body-sm text-muted-foreground mb-3">
                {systemReduced
                  ? t("preferences.motionDeviceAsks")
                  : t("preferences.motionHintLong")}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {MOTION_OPTIONS.map(({ value, labelKey, icon: Icon }) => {
                  const isActive = motion === value;
                  return (
                    <label
                      key={value}
                      htmlFor={`motion-${value}`}
                      className={cn(
                        "flex cursor-pointer flex-col items-center gap-1.5 rounded-md border p-3",
                        "transition-colors duration-(--duration-micro) ease-(--ease-standard)",
                        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                        isActive
                          ? "border-primary bg-primary-subtle text-primary-subtle-foreground"
                          : "border-border text-muted-foreground hover:border-border-strong",
                      )}
                    >
                      <input
                        type="radio"
                        id={`motion-${value}`}
                        name="motion"
                        checked={isActive}
                        onChange={() => setMotion(value)}
                        className="sr-only"
                      />
                      <Icon className="size-5" aria-hidden="true" />
                      <span className="text-label">{t(labelKey)}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </Card>

          <Card className="p-2">
            <h2 className="text-h2 px-3 pt-2 pb-1">{t("sections.activity")}</h2>
            <nav aria-label={t("sections.activityNav")}>
              <LinkRow
                to="/orders"
                icon={Package}
                label={t("common:nav.orders")}
                description={t("sections.ordersHint")}
              />
              <LinkRow
                to="/favourites"
                icon={Heart}
                label={t("common:nav.favourites")}
                description={t("sections.favouritesHint")}
              />
            </nav>
          </Card>

          <Card padded className="space-y-3">
            <h2 className="text-h2">{t("sections.security")}</h2>
            {/* Google accounts have no local password to change - the button
                would open a form that can only fail. */}
            {authUser?.googleId ? (
              <p className="text-body-sm text-muted-foreground flex items-start gap-2">
                <KeyRound className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {t("account.googleManaged")}
              </p>
            ) : (
              <>
                <p className="text-body-sm text-muted-foreground">
                  {t("account.passwordHint")}
                </p>
                <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
                  <KeyRound aria-hidden="true" />
                  {t("account.changePassword")}
                </Button>
              </>
            )}
          </Card>

          <Card padded className="space-y-3">
            <h2 className="text-h2">{t("preferences.notifications")}</h2>
            <div className="flex items-start gap-3">
              <Bell className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div className="space-y-1">
                <Label className="text-label">{t("notifications.orderUpdates")}</Label>
                <p className="text-body-sm text-muted-foreground">
                  {t("notifications.orderUpdatesHint")}
                </p>
              </div>
            </div>
          </Card>

          <Card padded className="space-y-3">
            <h2 className="text-h2">{t("sections.support")}</h2>
            <p className="text-body-sm text-muted-foreground">
              <Trans
                t={t}
                i18nKey="support.orderProblem"
                components={[<span key="cta" className="text-foreground" />]}
              />
            </p>
            <Button variant="outline" asChild>
              <a href="mailto:support@chowandgo.example">
                <LifeBuoy aria-hidden="true" />
                {t("support.emailSupport")}
              </a>
            </Button>
          </Card>

          {/* Separated from everything above: nothing here is a routine setting. */}
          <div className="border-border border-t pt-4">
            <Button
              variant="ghost"
              block
              className="text-destructive hover:bg-destructive-subtle justify-start"
              onClick={() => setShowSignOut(true)}
            >
              <LogOut aria-hidden="true" />
              {t("logOut.action")}
            </Button>
            <p className="text-caption text-muted-foreground mt-2 px-4">
              {t("account.signedInAs")} {authUser?.email}
            </p>
            <Button
              variant="ghost"
              block
              className="text-muted-foreground hover:text-destructive justify-start mt-2"
              onClick={() => setShowDeleteAccount(true)}
            >
              {t("deleteAccount.confirm")}
            </Button>
          </div>
        </Stack>
      </div>

      <DeleteAccountDialog
        open={showDeleteAccount}
        onOpenChange={setShowDeleteAccount}
      />

      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      <AlertDialog open={showSignOut} onOpenChange={setShowSignOut}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("logOut.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("logOut.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("logOut.stay")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={logout}
              className={cn(buttonVariants({ variant: "destructive" }))}
            >
              {t("logOut.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
