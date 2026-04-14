import React, { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, CheckCircle, Clock } from "lucide-react";

export function CourierOrders() {
  const [activeTab, setActiveTab] = useState("available");

  const tabs = [
    { id: "available", label: "Available (2)" },
    { id: "active", label: "Active (1)" },
    { id: "history", label: "History" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex space-x-1 rounded-xl bg-gray-200/50 p-1 dark:bg-zinc-900">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-zinc-800"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "available" && (
          <div className="space-y-4">
            {[1, 2].map((order) => (
              <div key={order} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4 dark:border-zinc-800">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">$7.50</span>
                  <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="h-4 w-4" /> 2.4 km total
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-3 w-3 rounded-full border-2 border-emerald-500 bg-white dark:bg-zinc-900" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Pizza Palace</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">123 Market St</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 text-red-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Customer Dropoff</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">456 Elm Ave, Apt 2B</p>
                    </div>
                  </div>
                </div>
                <button className="mt-6 w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">
                  Accept Delivery
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "active" && (
          <div className="rounded-2xl border border-emerald-100 bg-white overflow-hidden shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="bg-emerald-50 px-5 py-3 dark:bg-emerald-900/20">
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">HEADING TO RESTAURANT</span>
            </div>
            <div className="p-5">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Burger Joint</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">789 Tech Blvd • Order #4829</p>
              
              <div className="flex gap-3">
                <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">
                  <Navigation className="h-5 w-5" /> Navigate
                </button>
                <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 font-semibold text-gray-900 transition hover:bg-gray-200 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700">
                  <CheckCircle className="h-5 w-5" /> Picked Up
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Showing deliveries for today</p>
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Order #102{item}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Completed at 2:{item}0 PM</p>
                </div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">+$6.50</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}