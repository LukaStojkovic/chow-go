/**
 * Name, phone and profile photo.
 *
 * Read-only by default with one "Edit" affordance, rather than a permanently
 * editable form - a settings screen that always looks like a form invites
 * accidental edits and gives no signal that anything was saved.
 *
 * Validation runs on submit, not on every keystroke, and entered values
 * survive a failed save.
 */

import { useState } from "react";
import { Camera, Pencil } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/common/SmartImage";

/** Loose on purpose: international formats vary and a strict rule locks people out. */
const PHONE_PATTERN = /^[+()\d\s-]{6,20}$/;

export function PersonalDetailsCard() {
  const { authUser, apiUpdateProfile, isUpdatingProfile } = useAuthStore();

  // The form is seeded from the store each time it is opened, rather than kept
  // in sync by an effect. Outside edit mode the values below render straight
  // from `authUser`, so there is nothing to keep in step.
  const [editing, setEditing] = useState(null);
  const isEditing = editing !== null;
  const name = editing?.name ?? "";
  const phone = editing?.phone ?? "";
  const setName = (value) => setEditing((current) => ({ ...current, name: value }));
  const setPhone = (value) => setEditing((current) => ({ ...current, phone: value }));

  const [errors, setErrors] = useState({});

  const startEditing = () =>
    setEditing({ name: authUser?.name ?? "", phone: authUser?.phoneNumber ?? "" });

  const validate = () => {
    const next = {};
    if (name.trim().length < 2) next.name = "Enter your name - at least 2 characters.";
    if (phone.trim() && !PHONE_PATTERN.test(phone.trim())) {
      next.phone = "Use digits, spaces, and + ( ) - only.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    // Values stay in local state, so a failed request leaves the form as typed.
    await apiUpdateProfile({ name: name.trim(), phoneNumber: phone.trim() });
    setEditing(null);
  };

  const cancel = () => {
    setErrors({});
    setEditing(null);
  };

  return (
    <Card padded className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-h2">Personal details</h2>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={startEditing}>
            <Pencil aria-hidden="true" />
            Edit
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar size="lg" src={authUser?.profilePicture} name={authUser?.name || "You"} />
          {isEditing && (
            <span
              className="bg-muted text-muted-foreground border-card absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full border-2"
              title="Photo changes are not available yet"
            >
              <Camera className="size-3" aria-hidden="true" />
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-label truncate">{authUser?.name || "Your account"}</p>
          <p className="text-body-sm text-muted-foreground truncate">{authUser?.email}</p>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Full name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "profile-name-error" : undefined}
              autoComplete="name"
            />
            {errors.name && (
              <p id="profile-name-error" className="text-body-sm text-destructive">
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profile-phone">Phone number</Label>
            <Input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={
                errors.phone ? "profile-phone-error" : "profile-phone-hint"
              }
              autoComplete="tel"
              placeholder="+381 60 123 4567"
            />
            {errors.phone ? (
              <p id="profile-phone-error" className="text-body-sm text-destructive">
                {errors.phone}
              </p>
            ) : (
              <p id="profile-phone-hint" className="text-caption text-muted-foreground">
                Couriers use this to reach you about a delivery.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" isLoading={isUpdatingProfile} loadingLabel="Saving">
              Save changes
            </Button>
            <Button type="button" variant="ghost" onClick={cancel}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <dl className={cn("border-border divide-border divide-y border-t")}>
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-body-sm text-muted-foreground">Name</dt>
            <dd className="text-body-sm text-foreground text-right">
              {authUser?.name || "Not set"}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-body-sm text-muted-foreground">Phone</dt>
            <dd className="text-body-sm text-foreground text-right">
              {authUser?.phoneNumber || "Not set"}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-body-sm text-muted-foreground">Email</dt>
            <dd className="text-body-sm text-foreground truncate text-right">
              {authUser?.email}
            </dd>
          </div>
        </dl>
      )}
    </Card>
  );
}
