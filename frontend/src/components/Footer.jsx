import { UtensilsCrossed } from "lucide-react";
import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 py-16 px-4 sm:px-6 lg:px-8 border-t border-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-linear-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Chow & Go</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              The future of food delivery, today.
            </p>
          </div>

          {["Product", "Company", "Legal"].map((category) => (
            <div key={category}>
              <h4 className="font-semibold text-white mb-5 text-lg">
                {category}
              </h4>
              <ul className="space-y-3">
                {category === "Product" &&
                  ["Features", "Pricing", "Restaurants", "Riders"].map(
                    (item) => (
                      <li key={item}>
                        <a
                          href="#"
                          className="text-gray-400 hover:text-emerald-400 transition-colors duration-200"
                        >
                          {item}
                        </a>
                      </li>
                    )
                  )}
                {category === "Company" &&
                  ["About", "Careers", "Blog", "Press"].map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-gray-400 hover:text-emerald-400 transition-colors duration-200"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                {category === "Legal" &&
                  [
                    "Privacy Policy",
                    "Terms of Service",
                    "Cookies",
                    "Licenses",
                  ].map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-gray-400 hover:text-emerald-400 transition-colors duration-200"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p className="text-gray-500">
            © {new Date().getFullYear()} Chow & Go. All rights reserved.
          </p>
          <div className="flex gap-8">
            {["Privacy", "Terms", "Contact"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-gray-400 hover:text-emerald-400 transition-colors duration-200"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
