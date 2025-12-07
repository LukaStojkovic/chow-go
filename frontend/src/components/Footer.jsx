import React from "react";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ShoppingBag,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8 dark:bg-zinc-950 dark:border-zinc-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                Chow & Go
              </span>
            </div>
            <p className="mb-6 max-w-sm text-gray-500 dark:text-gray-400">
              The smartest way to order food. Real-time tracking, AI
              recommendations, and fast delivery from your favorite local spots.
            </p>
            <div className="flex gap-4">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-emerald-100 hover:text-emerald-600 transition-colors dark:bg-zinc-800 dark:text-gray-400 dark:hover:bg-zinc-700"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {["Company", "Product", "Legal"].map((category) => (
            <div key={category}>
              <h4 className="mb-6 font-bold text-gray-900 dark:text-white">
                {category}
              </h4>
              <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
                {[1, 2, 3, 4].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="hover:text-emerald-600 transition-colors"
                    >
                      {category} Link {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-gray-100 pt-8 dark:border-zinc-800">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Chow & Go. All rights reserved.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-gray-900 dark:hover:text-white">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-white">
                Terms of Service
              </a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-white">
                Cookie Settings
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
