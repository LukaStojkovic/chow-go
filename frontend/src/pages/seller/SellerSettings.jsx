import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
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

export const SellerSettings = () => {
  const { authUser, apiUpdateRestaurant, isUpdatingProfile } = useAuthStore();
  const restaurant = authUser?.restaurant?.[0] || {};
  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);

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

    if (!file) return toast.error("No file selected");
    if (file.size > 10 * 1024 * 1024)
      return toast.error("Max file size is 10MB");

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      return toast.error("Only JPG, PNG, WEBP allowed");

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

    toast.success("Applied to every day of the week");
  };

  const displayImage =
    previewImage || restaurant.profilePicture || "/defaultProfilePicture.png";

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 pb-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
              <Avatar className="w-24 h-24">
                <AvatarImage
                  src={displayImage}
                  alt="Restaurant Logo"
                  className="w-full h-full object-cover"
                />
                <AvatarFallback>
                  {restaurant.name?.charAt(0) || "R"}
                </AvatarFallback>
              </Avatar>

              {isUpdatingProfile && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
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
                className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-primary hover:bg-primary"
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
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">General Information</h3>
          <CardDescription className="text-sm text-muted-foreground">
            Changes are saved automatically as you type
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Restaurant Name</Label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="pl-10"
                  placeholder="Enter restaurant name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="pl-10"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Tell customers about your restaurant..."
                className="min-h-[100px] max-h-[200px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Contact email</Label>
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
                Estimated Delivery Time
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="estimatedDeliveryTime"
                  value={formData.estimatedDeliveryTime}
                  onChange={handleInputChange}
                  placeholder="e.g., 30-45 min"
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Address</h3>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="street">Street</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  className="pl-10"
                  placeholder="Street address"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="City"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State/Region</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="State or region"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">Zip Code</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                placeholder="Zip code"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={handleInputChange}
                placeholder="Country"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Operating Hours</h3>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                Set hours for each day, or switch a day off to close it entirely
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
              Copy Monday to all
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {WEEK_DAYS.map(({ key, label }) => {
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
                      <span className="font-medium">{label}</span>
                      {isToday && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-primary-subtle text-primary ">
                          Today
                        </span>
                      )}
                    </Label>
                  </div>

                  {day.isOpen ? (
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            Opens
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
                            Closes
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
                          Open 24 hours
                        </p>
                      )}

                      {isOvernight(day) && (
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MoonStar className="w-3.5 h-3.5" />
                          Closes after midnight, the next morning
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        Closed all day — customers cannot order.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
