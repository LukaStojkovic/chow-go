import { NavLink } from "react-router-dom";

export const SidebarLink = ({ to, icon: Icon, label, onClick }) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
          isActive
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-semibold shadow-sm"
            : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white"
        }`
      }
    >
      <Icon className="w-5 h-5 transition-colors" />
      <span>{label}</span>
    </NavLink>
  );
};
