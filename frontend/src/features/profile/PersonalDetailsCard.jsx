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

import { useEffect, useRef, useState } from "react";
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

/**
 * Cloudinary's allowed_formats rejects anything else with a 400 that reaches
 * the browser as a generic failure, so an unsupported pick is caught here
 * where it can be explained. HEIC is the common one, straight off an iPhone.
 */
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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

  // The photo rides along with the form rather than uploading on pick, so
  // Cancel discards it like any other unsaved edit.
  const [photo, setPhoto] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!photo) return;
    return () => URL.revokeObjectURL(photo.preview);
  }, [photo]);

  const startEditing = () =>
    setEditing({ name: authUser?.name ?? "", phone: authUser?.phoneNumber ?? "" });

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    // Reset the input so re-picking the same file still fires a change event.
    event.target.value = "";
    if (!file) return;

    if (!IMAGE_TYPES.includes(file.type)) {
      setErrors((current) => ({ ...current, photo: "Use a JPEG, PNG or WebP image." }));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErrors((current) => ({ ...current, photo: "That image is over 5 MB." }));
      return;
    }

    setErrors((current) => ({ ...current, photo: undefined }));
    setPhoto({ file, preview: URL.createObjectURL(file) });
  };

  const validate = () => {
    const next = {};
    if (name.trim().length < 2) next.name = "Enter your name - at least 2 characters.";
    if (phone.trim() && !PHONE_PATTERN.test(phone.trim())) {
      next.phone = "Use digits, spaces, and + ( ) - only.";
    }
    setErrors((current) => ({ ...next, photo: current.photo }));
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    // `phone` is the key the backend reads; `phoneNumber` is what it stores.
    const fields = { name: name.trim(), phone: phone.trim() };

    let payload = fields;
    if (photo) {
      payload = new FormData();
      for (const [key, value] of Object.entries(fields)) payload.append(key, value);
      payload.append("profilePicture", photo.file);
    }

    // Values stay in local state, so a failed request leaves the form as typed.
    const response = await apiUpdateProfile(payload);
    if (!response) return;

    setPhoto(null);
    setEditing(null);
  };

  const cancel = () => {
    setErrors({});
    setPhoto(null);
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
          <Avatar
            size="lg"
            src={photo?.preview || authUser?.profilePicture}
            name={authUser?.name || "You"}
          />
          {isEditing && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-primary text-primary-foreground border-card hover:bg-primary/90 focus-visible:ring-ring absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full border-2 focus-visible:ring-2 focus-visible:outline-none"
                aria-label="Change profile photo"
              >
                <Camera className="size-3" aria-hidden="true" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-label truncate">{authUser?.name || "Your account"}</p>
          <p className="text-body-sm text-muted-foreground truncate">{authUser?.email}</p>
          {isEditing &&
            (errors.photo ? (
              <p className="text-body-sm text-destructive">{errors.photo}</p>
            ) : (
              photo && (
                <p className="text-caption text-muted-foreground">
                  New photo - saves with your changes.
                </p>
              )
            ))}
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
