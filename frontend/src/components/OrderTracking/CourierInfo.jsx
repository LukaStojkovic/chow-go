import { Bike, Phone } from "lucide-react";

export function CourierInfo({ courier }) {
  if (!courier) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
      <h3 className="font-bold text-lg mb-4">Delivery Partner</h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Bike className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-semibold">{courier.fullName}</p>
            <p className="text-sm text-gray-500 capitalize">
              {courier.vehicleType}
            </p>
          </div>
        </div>
        <a
          href={`tel:${courier.phoneNumber}`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Phone className="h-4 w-4" />
          <span className="text-sm font-medium">Call</span>
        </a>
      </div>
    </div>
  );
}