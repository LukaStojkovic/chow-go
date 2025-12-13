import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-dropdown-menu";
import { Camera, Globe, MapPin, Phone, Store } from "lucide-react";

export const SellerSettings = () => {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
              <Avatar className="w-24 h-24">
                <AvatarImage
                  src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200&q=80"
                  alt="Restaurant Logo"
                />
                <AvatarFallback>TB</AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-emerald-600 hover:bg-emerald-700"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-center md:text-left flex-1">
              <h2 className="text-2xl font-bold">Tasty Bites Restaurant</h2>
              <CardDescription className="text-sm">
                ID: #839201 • Premium Partner
              </CardDescription>
            </div>
            <Button className="md:ml-auto">Save Changes</Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">General Information</h3>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Restaurant Name</Label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  defaultValue="Tasty Bites Restaurant"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  defaultValue="+1 (555) 000-0000"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="address"
                  defaultValue="123 Delicious Street, Foodie City, FC 90210"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="website"
                  defaultValue="https://tastybites.com"
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
