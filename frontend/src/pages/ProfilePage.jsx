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

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const MOTION_OPTIONS = [
  { value: "full", label: "Full", icon: Waves },
  { value: "reduced", label: "Reduced", icon: Sparkles },
  { value: "system", label: "System", icon: Monitor },
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
            <h2 className="text-h2">Appearance</h2>

            <fieldset>
              <legend className="sr-only">Choose a theme</legend>
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map(({ value, label, icon: Icon }) => {
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
                      <span className="text-label">{label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-label text-foreground mb-1">Animations</legend>
              <p className="text-body-sm text-muted-foreground mb-3">
                {systemReduced
                  ? "Your device asks apps to reduce motion. This app animates anyway - pick System to follow the device setting, or Reduced to stop movement everywhere."
                  : "Panels, cards and page changes animate. Choose Reduced to keep movement to a minimum, or System to follow your device."}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {MOTION_OPTIONS.map(({ value, label, icon: Icon }) => {
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
                      <span className="text-label">{label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </Card>

          <Card className="p-2">
            <h2 className="text-h2 px-3 pt-2 pb-1">Your activity</h2>
            <nav aria-label="Account sections">
              <LinkRow
                to="/orders"
                icon={Package}
                label="Orders"
                description="Track deliveries and reorder"
              />
              <LinkRow
                to="/favourites"
                icon={Heart}
                label="Favourites"
                description="Restaurants you have saved"
              />
            </nav>
          </Card>

          <Card padded className="space-y-3">
            <h2 className="text-h2">Security</h2>
            {/* Google accounts have no local password to change - the button
                would open a form that can only fail. */}
            {authUser?.googleId ? (
              <p className="text-body-sm text-muted-foreground flex items-start gap-2">
                <KeyRound className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                You sign in with Google, so your password is managed there.
              </p>
            ) : (
              <>
                <p className="text-body-sm text-muted-foreground">
                  Choose a password you do not use anywhere else.
                </p>
                <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
                  <KeyRound aria-hidden="true" />
                  Change password
                </Button>
              </>
            )}
          </Card>

          <Card padded className="space-y-3">
            <h2 className="text-h2">Notifications</h2>
            <div className="flex items-start gap-3">
              <Bell className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div className="space-y-1">
                <Label className="text-label">Order updates</Label>
                <p className="text-body-sm text-muted-foreground">
                  You get live updates on this device while an order is in progress. Email
                  and push notification preferences are not available yet.
                </p>
              </div>
            </div>
          </Card>

          <Card padded className="space-y-3">
            <h2 className="text-h2">Help and support</h2>
            <p className="text-body-sm text-muted-foreground">
              Problem with a specific order? Open it from your orders and use{" "}
              <span className="text-foreground">Get help with this order</span> - the
              restaurant can usually fix it fastest.
            </p>
            <Button variant="outline" asChild>
              <a href="mailto:support@chowandgo.example">
                <LifeBuoy aria-hidden="true" />
                Email support
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
              Sign out
            </Button>
            <p className="text-caption text-muted-foreground mt-2 px-4">
              Signed in as {authUser?.email}
            </p>
            <Button
              variant="ghost"
              block
              className="text-muted-foreground hover:text-destructive justify-start mt-2"
              onClick={() => setShowDeleteAccount(true)}
            >
              Delete my account
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
            <AlertDialogTitle>Sign out of Chow &amp; Go?</AlertDialogTitle>
            <AlertDialogDescription>
              Your basket and saved addresses stay on your account. You can sign back in
              any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay signed in</AlertDialogCancel>
            <AlertDialogAction
              onClick={logout}
              className={cn(buttonVariants({ variant: "destructive" }))}
            >
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
