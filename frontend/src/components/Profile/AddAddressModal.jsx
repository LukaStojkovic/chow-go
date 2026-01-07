import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronLeft, Home, Briefcase, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { LocationMapSelector } from "../Location/LocationMapSelector";
import Modal from "../Modal";
import { cn } from "@/lib/utils";
import useReverseGeocoding from "@/hooks/Location/useReverseGeocoding";
import Spinner from "../Spinner";

const LABEL_OPTIONS = [
  { id: "home", label: "Home", icon: Home },
  { id: "work", label: "Work", icon: Briefcase },
  { id: "partner", label: "Partner", icon: Heart },
  { id: "other", label: "Other", icon: MapPin },
];

export default function AddAddressModal({ isOpen, onClose, onSave }) {
  const [view, setView] = useState("map");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [details, setDetails] = useState({
    apartment: "",
    floor: "",
    entrance: "",
    doorCode: "",
    notes: "",
    label: "home",
  });

  const { data: addressData, isLoading: isAddressLoading } =
    useReverseGeocoding(selectedLocation?.lat, selectedLocation?.lng);

  useEffect(() => {
    if (isOpen) setView("map");
  }, [isOpen]);

  const handleConfirmLocation = () => {
    if (selectedLocation) setView("details");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      noPadding={view === "map"}
      title={view === "details" ? "Delivery address" : "Select your location"}
    >
      <div className="h-[600px] flex flex-col relative">
        <AnimatePresence mode="wait">
          {view === "map" ? (
            <motion.div
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col relative"
            >
              <div className="flex-1">
                <LocationMapSelector
                  onLocationChange={(lat, lng) =>
                    setSelectedLocation({ lat, lng })
                  }
                  className="h-full w-full"
                />
              </div>

              <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  onClick={handleConfirmLocation}
                  disabled={!selectedLocation}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-base transition-all active:scale-[0.98]"
                >
                  Confirm location
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="details"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                <button
                  onClick={() => setView("map")}
                  className="flex items-center gap-1 text-emerald-600 font-bold text-sm hover:opacity-80 transition-opacity"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Change location
                </button>

                <div className="flex items-center gap-3 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <div className="p-2 rounded-lg">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="overflow-hidden">
                    Selected Location
                    <p className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-2">
                      {isAddressLoading ? (
                        <Spinner size="sm" />
                      ) : (
                        addressData?.address
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider">
                      Apartment
                    </Label>
                    <Input
                      placeholder="e.g. 12"
                      className="border-none h-11 focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider">
                      Floor
                    </Label>
                    <Input
                      placeholder="e.g. 4"
                      className="border-none h-11 focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider">
                    Save as
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {LABEL_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() =>
                          setDetails({ ...details, label: opt.id })
                        }
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold transition-all",
                          details.label === opt.id
                            ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600"
                            : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        )}
                      >
                        <opt.icon className="w-4 h-4" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 pb-4">
                  <Label className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider">
                    Delivery notes
                  </Label>
                  <Textarea
                    placeholder="Information for the courier..."
                    className="border-none min-h-[100px] focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  onClick={() =>
                    onSave?.({
                      ...details,
                      location: selectedLocation,
                      address: addressData?.address,
                    })
                  }
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
                >
                  Save address
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
