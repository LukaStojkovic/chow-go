import { NavLink } from "react-router-dom";

import { prefetchRoute } from "@/lib/routeChunks";

export const SidebarLink = ({ to, icon: Icon, label, onClick }) => {
  const warm = () => prefetchRoute(to);

  return (
    <NavLink
      to={to}
      onClick={onClick}
      onMouseEnter={warm}
      onFocus={warm}
      onTouchStart={warm}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
          isActive
            ? "bg-primary-subtle text-primary font-semibold shadow-sm"
            : "text-muted-foreground hover:bg-muted hover:text-foreground "
        }`
      }
    >
      <Icon className="w-5 h-5 transition-colors" />
      <span>{label}</span>
    </NavLink>
  );
};
