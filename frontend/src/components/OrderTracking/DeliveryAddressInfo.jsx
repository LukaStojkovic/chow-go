import { MapPin } from "lucide-react";

export function DeliveryAddressInfo({ address }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
      <h3 className="font-bold text-lg mb-4">Delivery Address</h3>
      <div className="flex items-start gap-3">
        <MapPin className="h-5 w-5 text-gray-400 shrink-0 mt-1" />
        <div>
          <p className="font-semibold mb-1">{address.label}</p>
          <p className="text-sm text-gray-500">{address.fullAddress}</p>
          {address.notes && (
            <p className="text-sm text-gray-400 mt-2">Note: {address.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}
