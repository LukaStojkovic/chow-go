import React from "react";
import { User, Bike, Star, ShieldCheck, Settings } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export function CourierProfile() {
  const { authUser } = useAuthStore();

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 sm:flex-row sm:items-start sm:gap-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 sm:mb-0 dark:bg-emerald-900/20 dark:text-emerald-400">
          <User className="h-12 w-12" />
        </div>
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{authUser?.name || "Alex Courier"}</h2>
          <p className="text-gray-500 dark:text-gray-400">{authUser?.email || "alex@example.com"}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> 4.9 Rating
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Background Verified
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-4 dark:border-zinc-800">
            <Bike className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h3 className="font-bold text-gray-900 dark:text-white">Vehicle Details</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Vehicle Type</p>
              <p className="font-medium text-gray-900 dark:text-white">Bicycle</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">City</p>
              <p className="font-medium text-gray-900 dark:text-white">Downtown Area</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-4 dark:border-zinc-800">
            <Settings className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h3 className="font-bold text-gray-900 dark:text-white">App Preferences</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Auto-Accept Orders</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Automatically accept nearby pings</p>
              </div>
              <div className="h-6 w-11 rounded-full bg-gray-200 dark:bg-zinc-700"></div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Voice Navigation</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Read directions aloud</p>
              </div>
              <div className="h-6 w-11 flex items-center justify-end rounded-full bg-emerald-500 p-1">
                <div className="h-4 w-4 rounded-full bg-white"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}