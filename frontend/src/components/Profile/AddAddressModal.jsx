import { Suspense, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ADDRESS_LABELS, ADDRESS_TYPES, matchAddressLabel } from "@/lib/constants";
import { lazyNamed } from "@/lib/lazyNamed";
import { cn } from "@/lib/utils";
import useReverseGeocoding from "@/hooks/Location/useReverseGeocoding";
import Spinner from "../Spinner";

const LocationMapSelector = lazyNamed(
  () => import("../Location/LocationMapSelector"),
  "LocationMapSelector",
);

export default function AddAddressModal({
  isOpen,
  onSave,
  onClose,
  isLoading,
  initialData,
}) {
  const [view, setView] = useState(initialData ? "details" : "map");
  const [selectedLocation, setSelectedLocation] = useState(
    initialData?.location?.coordinates
      ? {
          lat: initialData.location.coordinates[1],
          lng: initialData.location.coordinates[0],
        }
      : null
  );

  const [form, setForm] = useState({
    type: initialData?.addressType || "apartment",
    apartment: initialData?.apartment || "",
    floor: initialData?.floor || "",
    entrance: initialData?.entrance || "",
    doorCode: initialData?.doorCode || "",
    buildingName: initialData?.buildingName || "",
    notes: initialData?.notes || "",
    label: matchAddressLabel(initialData?.label),
  });

  const { data: addressData, isLoading: isAddressLoading } =
    useReverseGeocoding(selectedLocation?.lat, selectedLocation?.lng);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setView("details");
        setSelectedLocation({
          lat: initialData.location.coordinates[1],
          lng: initialData.location.coordinates[0],
        });
        setForm({
          type: initialData.addressType || "apartment",
          apartment: initialData.apartment || "",
          floor: initialData.floor || "",
          entrance: initialData.entrance || "",
          doorCode: initialData.doorCode || "",
          buildingName: initialData.buildingName || "",
          notes: initialData.notes || "",
          label: matchAddressLabel(initialData.label),
        });
      } else {
        setView("map");
        setSelectedLocation(null);
        setForm({
          type: "apartment",
          apartment: "",
          floor: "",
          entrance: "",
          doorCode: "",
          buildingName: "",
          notes: "",
          label: "Home",
        });
      }
    }
  }, [isOpen, initialData]);

  const handleConfirmLocation = () => {
    if (selectedLocation) setView("details");
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await onSave?.({
        ...form,
        location: selectedLocation,
        address: addressData?.address || initialData?.fullAddress || "",
      });
      onClose?.();
    } catch (error) {
      console.error("Failed to save address:", error);
    }
  };

  const handleLocationChange = useCallback((lat, lng) => {
    setSelectedLocation({ lat, lng });
  }, []);

  const currentType = form.type;

  return (
    <div className="h-[580px] md:h-[640px] flex flex-col">
      <AnimatePresence mode="wait">
        {view === "map" ? (
          <motion.div
            key="map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex-1">
              <Suspense
                fallback={<div className="h-full w-full animate-pulse bg-muted" />}
              >
                <LocationMapSelector
                  onLocationChange={handleLocationChange}
                  className="h-full w-full"
                />
              </Suspense>
            </div>

            <div className="p-4 sm:p-5 border-t border-border ">
              <Button
                onClick={handleConfirmLocation}
                disabled={!selectedLocation}
                className="w-full h-12 bg-primary hover:bg-primary text-primary-foreground rounded-xl font-bold transition-all active:scale-95"
              >
                Confirm location
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="details"
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -30, opacity: 0 }}
            className="flex flex-col h-full"
          >
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600">
              <button
                onClick={() => setView("map")}
                className="flex items-center gap-1.5 text-primary font-medium hover:opacity-80 transition-opacity"
              >
                <ChevronLeft className="w-5 h-5" />
                Change location
              </button>

              <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card/50 ">
                <div className="p-2.5 rounded-lg bg-primary-subtle/50 ">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground ">
                    Selected Location
                  </div>
                  <p className="text-sm font-medium text-foreground line-clamp-2">
                    {isAddressLoading ? (
                      <Spinner size={16} />
                    ) : (
                      addressData?.address || "Location selected"
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                  Address Type
                </Label>
                <Select
                  value={form.type}
                  onValueChange={(val) => updateForm("type", val)}
                >
                  <SelectTrigger className="h-11 border-border focus:ring-ring">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ADDRESS_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(currentType === "apartment" ||
                currentType === "office" ||
                currentType === "hotel" ||
                currentType === "other") && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                    Building name
                  </Label>
                  <Input
                    placeholder="e.g. Green Life Residence"
                    value={form.buildingName}
                    onChange={(e) => updateForm("buildingName", e.target.value)}
                    className="h-11 border-border focus-visible:ring-ring"
                  />
                </div>
              )}

              {currentType === "apartment" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                        Floor
                      </Label>
                      <Input
                        placeholder="e.g. 4"
                        value={form.floor}
                        onChange={(e) => updateForm("floor", e.target.value)}
                        className="h-11 border-border focus-visible:ring-ring"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                        Apartment
                      </Label>
                      <Input
                        placeholder="e.g. 12A"
                        value={form.apartment}
                        onChange={(e) =>
                          updateForm("apartment", e.target.value)
                        }
                        className="h-11 border-border focus-visible:ring-ring"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                      Entrance / Staircase
                    </Label>
                    <Input
                      placeholder="e.g. A, B, Left"
                      value={form.entrance}
                      onChange={(e) => updateForm("entrance", e.target.value)}
                      className="h-11 border-border focus-visible:ring-ring"
                    />
                  </div>
                </>
              )}

              {currentType === "house" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                      Entrance / Staircase
                    </Label>
                    <Input
                      placeholder="e.g. Main entrance"
                      value={form.entrance}
                      onChange={(e) => updateForm("entrance", e.target.value)}
                      className="h-11 border-border focus-visible:ring-ring"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                      Door / Gate number
                    </Label>
                    <Input
                      placeholder="e.g. 42B"
                      value={form.doorCode}
                      onChange={(e) => updateForm("doorCode", e.target.value)}
                      className="h-11 border-border focus-visible:ring-ring"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                  Save as
                </Label>
                <div className="flex flex-wrap gap-2">
                  {ADDRESS_LABELS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateForm("label", opt.value)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all",
                        form.label === opt.value
                          ? "border-primary bg-primary-subtle text-primary "
                          : "border-border hover:bg-muted ",
                      )}
                    >
                      <opt.icon className="w-4 h-4" />
                      {opt.value}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                  Delivery notes
                </Label>
                <Textarea
                  placeholder="Gate code, landmarks, call before delivery..."
                  value={form.notes}
                  onChange={(e) => updateForm("notes", e.target.value)}
                  className="min-h-[100px] border-border focus-visible:ring-ring resize-none"
                />
              </div>
            </div>

            <div className="shrink-0 border-t border-border  p-5 sm:p-6">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="w-full h-12 bg-primary hover:bg-primary text-primary-foreground rounded-xl font-bold shadow-md  transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Spinner size={16} />
                    Saving...
                  </>
                ) : initialData ? (
                  "Update address"
                ) : (
                  "Save address"
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
