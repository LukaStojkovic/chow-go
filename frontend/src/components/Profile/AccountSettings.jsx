import React, { useState } from "react";
import { Mail, Lock, Moon, Sun, LogOut, ShieldCheck } from "lucide-react";
import PasswordChangeModal from "./PasswordChangeModal";

export default function AccountSettings({
  authUser,
  isDark,
  toggle,
  onLogout,
}) {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-zinc-800 space-y-1">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">
        Account
      </h3>

      <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-xl transition cursor-pointer group">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 shrink-0 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
            <Mail size={18} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">Email</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {authUser?.email || "user@verylongdomainname.com"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="hidden sm:flex text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full items-center gap-1">
            <ShieldCheck size={10} /> Verified
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-xl transition cursor-pointer">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 shrink-0 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
            <Lock size={18} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">Password</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ••••••••••
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsPasswordModalOpen(true)}
          className="text-xs font-semibold cursor-pointer text-blue-600 px-2 py-1 rounded-md bg-blue-50 dark:bg-transparent dark:hover:bg-zinc-800"
        >
          Update
        </button>
      </div>

      <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-xl transition">
        <div className="flex items-center gap-3">
          <div className="p-2 shrink-0 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-lg">
            {isDark ? <Moon size={18} /> : <Sun size={18} />}
          </div>
          <span className="text-sm font-medium">Dark Mode</span>
        </div>
        <button
          onClick={toggle}
          className={`w-11 h-6 shrink-0 rounded-full p-1 transition-colors duration-300 flex items-center ${
            isDark ? "bg-blue-600" : "bg-gray-300"
          }`}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
              isDark ? "translate-x-5" : "translate-x-0"
            }`}
          ></div>
        </button>
      </div>

      <div className="pt-2 mt-2 border-t border-gray-100 dark:border-zinc-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center cursor-pointer gap-3 p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition text-sm font-medium"
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>

      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}
