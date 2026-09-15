import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TimePicker } from "@/components/ui/TimePicker";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/store/useAuthStore";
import { Label } from "@/components/ui/label";
import {
  Camera,
  MapPin,
  Phone,
  Store,
  Mail,
  Clock,
  Loader2,
  CopyPlus,
  MoonStar,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";
import {
  WEEK_DAYS,
  getTodayKey,
  isOvernight,
  normalizeSchedule,
} from "@chowgo/shared/schedule";
import { DeleteAccountDialog } from "@/components/Profile/DeleteAccountDialog";

export const SellerSettings = () => {
  const { t } = useTranslation(["seller", "auth", "profile", "restaurant", "common"]);
  const { authUser, apiUpdateRestaurant, isUpdatingProfile } = useAuthStore();
  const restaurant = authUser?.restaurant?.[0] || {};
  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  const [formData, setFormData] = useState({
    name: restaurant.name || "",
    description: restaurant.description || "",
    phone: restaurant.phone || "",
    email: restaurant.email || "",
    street: restaurant.address?.street || "",
    city: restaurant.address?.city || "",
    state: restaurant.address?.state || "",
    zipCode: restaurant.address?.zipCode || "",
    country: restaurant.address?.country || "",
    schedule: normalizeSchedule(restaurant.schedule),
    estimatedDeliveryTime: restaurant.estimatedDeliveryTime || "",
  });

  const todayKey = getTodayKey();

  const [debouncedFormData] = useDebounce(formData, 1000);

  const hasUserModified = useRef(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return toast.error(t("settings.noFileSelected"));
    if (file.size > 10 * 1024 * 1024)
      return toast.error(t("settings.maxFileSize", { size: 10 }));

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      return toast.error(t("settings.allowedTypes"));

    setPreviewImage(URL.createObjectURL(file));

    const formDataToSend = new FormData();
    formDataToSend.append("profilePicture", file);

    apiUpdateRestaurant(formDataToSend);
  };

  useEffect(() => {
    if (!hasUserModified.current) return;

    const formDataToSend = new FormData();

    formDataToSend.append("name", debouncedFormData.name);
    formDataToSend.append("description", debouncedFormData.description);
    formDataToSend.append("phone", debouncedFormData.phone);
    formDataToSend.append("email", debouncedFormData.email);
    formDataToSend.append(
      "estimatedDeliveryTime",
      debouncedFormData.estimatedDeliveryTime,
    );

    WEEK_DAYS.forEach(({ key }) => {
      const day = debouncedFormData.schedule[key];

      formDataToSend.append(
        `schedule[${key}][isOpen]`,
        day.isOpen ? "true" : "false",
      );
      formDataToSend.append(`schedule[${key}][openingTime]`, day.openingTime);
      formDataToSend.append(`schedule[${key}][closingTime]`, day.closingTime);
    });

    formDataToSend.append("address[street]", debouncedFormData.street);
    formDataToSend.append("address[city]", debouncedFormData.city);
    formDataToSend.append("address[state]", debouncedFormData.state);
    formDataToSend.append("address[zipCode]", debouncedFormData.zipCode);
    formDataToSend.append("address[country]", debouncedFormData.country);

    apiUpdateRestaurant(formDataToSend);
  }, [debouncedFormData, apiUpdateRestaurant]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    hasUserModified.current = true;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const updateDay = (dayKey, changes) => {
    hasUserModified.current = true;
    setFormData((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [dayKey]: { ...prev.schedule[dayKey], ...changes },
      },
    }));
  };

  const copyDayToWholeWeek = (dayKey) => {
    hasUserModified.current = true;
    setFormData((prev) => {
      const source = prev.schedule[dayKey];

      return {
        ...prev,
        schedule: WEEK_DAYS.reduce((acc, { key }) => {
          acc[key] = { ...source };
          return acc;
        }, {}),
      };
    });

    toast.success(t("settings.appliedToEveryDay"));
  };

  const displayImage =
    previewImage || restaurant.profilePicture || "/defaultProfilePicture.png";

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 pb-8">
      <Card>
        {/* CardContent, not CardHeader: this card has no body below it, and a
            header carries no bottom padding - the avatar spilled past the card
            edge. */}
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Sized to the avatar so the uploading overlay's `inset-0` stays a
                circle - it used to inherit the wrapper's height and render as a
                dark pill hanging below the image. */}
            <div className="relative size-24 shrink-0">
              <Avatar className="size-24">
                <AvatarImage
                  src={displayImage}
                  alt={t("settings.profile.logo")}
                  className="w-full h-full object-cover"
                />
                <AvatarFallback>
                  {restaurant.name?.charAt(0) || "R"}
                </AvatarFallback>
              </Avatar>

              {isUpdatingProfile && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              <Button
                size="icon"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUpdatingProfile}
                aria-label={t("settings.profile.changeLogo")}
                className="absolute bottom-0 right-0 size-8 rounded-full ring-2 ring-card"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-center md:text-left flex-1">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <h2 className="text-2xl font-bold">{restaurant.name}</h2>
                {isUpdatingProfile && (
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                )}
              </div>
              <CardDescription className="text-sm mt-1">
                {restaurant.cuisineType && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-subtle text-primary">
                    {restaurant.cuisineType}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">{t("settings.profile.heading")}</h3>
          <CardDescription className="text-sm text-muted-foreground">
            {t("settings.autosaveHint")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t("settings.profile.name")}</Label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="pl-10"
                  placeholder={t("auth:restaurant.namePlaceholder")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("settings.profile.phone")}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="pl-10"
                  placeholder={t("auth:restaurant.phonePlaceholder")}
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">{t("settings.profile.description")}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder={t("settings.profile.descriptionPlaceholder")}
                className="min-h-[100px] max-h-[200px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("settings.profile.email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10"
                  placeholder="restaurant@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedDeliveryTime">
                {t("settings.delivery.estimate")}
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="estimatedDeliveryTime"
                  value={formData.estimatedDeliveryTime}
                  onChange={handleInputChange}
                  placeholder={t("settings.delivery.estimatePlaceholder")}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">{t("settings.location.heading")}</h3>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="street">{t("settings.location.address")}</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  className="pl-10"
                  placeholder={t("auth:restaurant.addressPlaceholder")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">{t("settings.location.city")}</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder={t("auth:restaurant.cityPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">{t("settings.location.state")}</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder={t("auth:restaurant.statePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">{t("settings.location.zip")}</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                placeholder={t("auth:restaurant.zipPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">{t("settings.location.country")}</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={handleInputChange}
                placeholder={t("settings.location.country")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{t("settings.hours.heading")}</h3>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                {t("settings.hours.hint")}
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copyDayToWholeWeek("monday")}
              className="shrink-0"
            >
              <CopyPlus className="w-4 h-4 mr-2" />
              {t("settings.hours.copyMonday")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {WEEK_DAYS.map(({ key }) => {
              const day = formData.schedule[key];
              const isToday = key === todayKey;

              return (
                <div
                  key={key}
                  className="flex flex-col lg:flex-row lg:items-center gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 lg:w-56 shrink-0">
                    <Switch
                      id={`schedule-${key}`}
                      checked={day.isOpen}
                      onCheckedChange={(checked) =>
                        updateDay(key, { isOpen: checked })
                      }
                    />
                    <Label
                      htmlFor={`schedule-${key}`}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span className="font-medium">
                        {t(`common:taxonomy.day.${key}.label`)}
                      </span>
                      {isToday && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-primary-subtle text-primary ">
                          {t("restaurant:hours.today")}
                        </span>
                      )}
                    </Label>
                  </div>

                  {day.isOpen ? (
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            {t("settings.hours.opensAt")}
                          </Label>
                          <TimePicker
                            value={day.openingTime}
                            onChange={(val) =>
                              updateDay(key, { openingTime: val })
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            {t("settings.hours.closesAt")}
                          </Label>
                          <TimePicker
                            value={day.closingTime}
                            onChange={(val) =>
                              updateDay(key, { closingTime: val })
                            }
                          />
                        </div>
                      </div>

                      {day.openingTime === day.closingTime && (
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {t("settings.hours.openAllDay")}
                        </p>
                      )}

                      {isOvernight(day) && (
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MoonStar className="w-3.5 h-3.5" />
                          {t("settings.hours.overnightHint")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        {t("settings.hours.closedHint")}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("profile:sections.account")}</CardTitle>
          <CardDescription>
            {t("settings.deleteAccountHint")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-destructive px-0"
            onClick={() => setShowDeleteAccount(true)}
          >
            {t("profile:deleteAccount.confirm")}
          </Button>
        </CardContent>
      </Card>

      <DeleteAccountDialog
        open={showDeleteAccount}
        onOpenChange={setShowDeleteAccount}
      />
    </div>
  );
};
