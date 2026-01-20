import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  ChevronLeft,
  Home,
  Building,
  Hotel,
  Briefcase,
  House,
  MapPin as MapPinIcon,
  Heart,
} from "lucide-react";
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

import { LocationMapSelector } from "../Location/LocationMapSelector";
import { cn } from "@/lib/utils";
import useReverseGeocoding from "@/hooks/Location/useReverseGeocoding";
import Spinner from "../Spinner";

const LABEL_OPTIONS = [
  { id: "home", label: "Home", icon: Home },
  { id: "work", label: "Work", icon: Briefcase },
  { id: "partner", label: "Partner", icon: Heart },
  { id: "other", label: "Other", icon: MapPin },
];

const ADDRESS_TYPES = [
  { value: "apartment", label: "Apartment", icon: Building },
  { value: "house", label: "House", icon: House },
  { value: "office", label: "Office", icon: Briefcase },
  { value: "hotel", label: "Hotel", icon: Hotel },
  { value: "other", label: "Other", icon: MapPinIcon },
];

export default function AddAddressModal({
  isOpen,
  onSave,
  onClose,
  isLoading,
}) {
  const [view, setView] = useState("map");
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [form, setForm] = useState({
    type: "apartment",
    apartment: "",
    floor: "",
    entrance: "",
    doorCode: "",
    buildingName: "",
    notes: "",
    label: "home",
  });

  const { data: addressData, isLoading: isAddressLoading } =
    useReverseGeocoding(selectedLocation?.lat, selectedLocation?.lng);

  useEffect(() => {
    if (isOpen) {
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
        label: "home",
      });
    }
  }, [isOpen]);

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
        address: addressData?.address || "",
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
              <LocationMapSelector
                onLocationChange={handleLocationChange}
                className="h-full w-full"
              />
            </div>

            <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800">
              <Button
                onClick={handleConfirmLocation}
                disabled={!selectedLocation}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all active:scale-95"
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
                className="flex items-center gap-1.5 text-emerald-600 font-medium hover:opacity-80 transition-opacity"
              >
                <ChevronLeft className="w-5 h-5" />
                Change location
              </button>

              <div className="flex items-center gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50">
                <div className="p-2.5 rounded-lg bg-emerald-100/50 dark:bg-emerald-900/30">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Selected Location
                  </div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">
                    {isAddressLoading ? (
                      <Spinner size={16} />
                    ) : (
                      addressData?.address || "Location selected"
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
                  Address Type
                </Label>
                <Select
                  value={form.type}
                  onValueChange={(val) => updateForm("type", val)}
                >
                  <SelectTrigger className="h-11 border-zinc-300 dark:border-zinc-700 focus:ring-emerald-500">
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
                  <Label className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
                    Building name
                  </Label>
                  <Input
                    placeholder="e.g. Green Life Residence"
                    value={form.buildingName}
                    onChange={(e) => updateForm("buildingName", e.target.value)}
                    className="h-11 border-zinc-300 dark:border-zinc-700 focus-visible:ring-emerald-500"
                  />
                </div>
              )}

              {currentType === "apartment" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
                        Floor
                      </Label>
                      <Input
                        placeholder="e.g. 4"
                        value={form.floor}
                        onChange={(e) => updateForm("floor", e.target.value)}
                        className="h-11 border-zinc-300 dark:border-zinc-700 focus-visible:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
                        Apartment
                      </Label>
                      <Input
                        placeholder="e.g. 12A"
                        value={form.apartment}
                        onChange={(e) =>
                          updateForm("apartment", e.target.value)
                        }
                        className="h-11 border-zinc-300 dark:border-zinc-700 focus-visible:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
                      Entrance / Staircase
                    </Label>
                    <Input
                      placeholder="e.g. A, B, Left"
                      value={form.entrance}
                      onChange={(e) => updateForm("entrance", e.target.value)}
                      className="h-11 border-zinc-300 dark:border-zinc-700 focus-visible:ring-emerald-500"
                    />
                  </div>
                </>
              )}

              {currentType === "house" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
                      Entrance / Staircase
                    </Label>
                    <Input
                      placeholder="e.g. Main entrance"
                      value={form.entrance}
                      onChange={(e) => updateForm("entrance", e.target.value)}
                      className="h-11 border-zinc-300 dark:border-zinc-700 focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
                      Door / Gate number
                    </Label>
                    <Input
                      placeholder="e.g. 42B"
                      value={form.doorCode}
                      onChange={(e) => updateForm("doorCode", e.target.value)}
                      className="h-11 border-zinc-300 dark:border-zinc-700 focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
                  Save as
                </Label>
                <div className="flex flex-wrap gap-2">
                  {LABEL_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateForm("label", opt.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all",
                        form.label === opt.id
                          ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                          : "border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                      )}
                    >
                      <opt.icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
                  Delivery notes
                </Label>
                <Textarea
                  placeholder="Gate code, landmarks, call before delivery..."
                  value={form.notes}
                  onChange={(e) => updateForm("notes", e.target.value)}
                  className="min-h-[100px] border-zinc-300 dark:border-zinc-700 focus-visible:ring-emerald-500 resize-none"
                />
              </div>
            </div>

            <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800  p-5 sm:p-6">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Spinner size={16} />
                    Saving...
                  </>
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
