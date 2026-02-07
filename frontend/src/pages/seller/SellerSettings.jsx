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
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";

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
    openingTime: restaurant.openingTime || "",
    closingTime: restaurant.closingTime || "",
    estimatedDeliveryTime: restaurant.estimatedDeliveryTime || "",
  });

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
    formDataToSend.append("openingTime", debouncedFormData.openingTime);
    formDataToSend.append("closingTime", debouncedFormData.closingTime);
    formDataToSend.append(
      "estimatedDeliveryTime",
      debouncedFormData.estimatedDeliveryTime,
    );

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

  const displayImage =
    previewImage || restaurant.profilePicture || "/defaultProfilePicture.png";

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 pb-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
              <Avatar className="w-24 h-24">
                <AvatarImage src={displayImage} alt="Restaurant Logo" />
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
                className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-emerald-600 hover:bg-emerald-700"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-center md:text-left flex-1">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <h2 className="text-2xl font-bold">{restaurant.name}</h2>
                {isUpdatingProfile && (
                  <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                )}
              </div>
              <CardDescription className="text-sm mt-1">
                {restaurant.cuisineType && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
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
              <Label htmlFor="email">Email</Label>
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
          <h3 className="text-lg font-semibold">Operating Hours</h3>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="openingTime">Opening Time</Label>
              <Input
                id="openingTime"
                type="time"
                value={formData.openingTime}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="closingTime">Closing Time</Label>
              <Input
                id="closingTime"
                type="time"
                value={formData.closingTime}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
