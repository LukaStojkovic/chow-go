import { useEffect, useMemo, useState } from "react";

export function useDarkMode() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      return saved || "system";
    }
    return "system";
  });

  const isSystemDark = useMemo(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  }, []);

  const isDark = theme === "dark" || (theme === "system" && isSystemDark);

  const toggle = () => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  };

  useEffect(() => {
    const root = document.documentElement;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (t) => {
      const isCurrentlyDark =
        t === "dark" || (t === "system" && systemTheme.matches);

      if (isCurrentlyDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    applyTheme(theme);
    localStorage.setItem("theme", theme);

    const handleSystemChange = (e) => {
      if (theme === "system") {
        if (e.matches) root.classList.add("dark");
        else root.classList.remove("dark");
      }
    };

    systemTheme.addEventListener("change", handleSystemChange);
    return () => systemTheme.removeEventListener("change", handleSystemChange);
  }, [theme]);

  return { theme, setTheme, isDark, toggle };
}
