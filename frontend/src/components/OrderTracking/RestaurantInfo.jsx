import { Phone } from "lucide-react";

export function RestaurantInfo({ restaurant }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
      <h3 className="font-bold text-lg mb-4">Restaurant</h3>
      <div className="flex items-center gap-4 mb-4">
        <img
          src={restaurant.profilePicture}
          alt={restaurant.name}
          className="h-14 w-14 rounded-full object-cover"
        />
        <div>
          <p className="font-semibold">{restaurant.name}</p>
          <p className="text-sm text-gray-500">{restaurant.address?.street}</p>
        </div>
      </div>
      <a
        href={`tel:${restaurant.phone}`}
        className="flex items-center gap-2 text-blue-600 hover:underline"
      >
        <Phone className="h-4 w-4" />
        <span className="text-sm">{restaurant.phone}</span>
      </a>
    </div>
  );
}
