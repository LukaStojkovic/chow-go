import React from "react";
import {
  MapPin,
  Plus,
  Home,
  Briefcase,
  CheckCircle2,
  Trash2,
  Heart,
} from "lucide-react";

export default function SavedAddresses({
  addresses,
  onSetDefaultAddress,
  onAddNew,
  onDelete,
}) {
  const getAddressIcon = (label) => {
    const iconMap = {
      home: Home,
      work: Briefcase,
      partner: Heart,
      other: MapPin,
    };

    const IconComponent = iconMap[label?.toLowerCase()] || MapPin;
    return <IconComponent size={18} />;
  };

  return (
    <section className="bg-white dark:bg-zinc-900 rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <MapPin size={20} className="text-blue-500" /> Saved Addresses
        </h2>
        <button
          onClick={onAddNew}
          className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition shadow-sm font-medium shrink-0"
        >
          <Plus size={16} /> <span className="hidden sm:inline">Add New</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => {
          const Icon = getAddressIcon(addr.label);

          return (
            <div
              key={addr._id}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                addr.isDefault
                  ? "border-blue-500 bg-blue-50/30 dark:bg-blue-900/10"
                  : "border-transparent bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800/80"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className={`p-2 shrink-0 rounded-lg ${
                      addr.isDefault
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50"
                        : "bg-gray-200 text-gray-500 dark:bg-zinc-700"
                    }`}
                  >
                    {Icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                      {addr.label?.charAt(0).toUpperCase() +
                        addr.label?.slice(1)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {addr.fullAddress}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!addr.isDefault && (
                    <button
                      onClick={() => onSetDefaultAddress(addr._id)}
                      title="Set Default"
                      className="p-1.5 text-gray-400 hover:text-blue-500 transition"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(addr._id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
