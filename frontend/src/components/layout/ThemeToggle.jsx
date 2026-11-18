import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("ndo-theme") || "observatory";
  });

  const isDark = theme === "observatory-dark";

  useEffect(() => {
    // Set the theme on the root HTML tag so DaisyUI recognizes it globally
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ndo-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) =>
      current === "observatory" ? "observatory-dark" : "observatory"
    );
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={`
        group relative inline-flex h-9
        items-center gap-3 rounded-full
        border px-3 backdrop-blur-xl
        transition-all duration-300 ease-in-out
        hover:-translate-y-0.5 hover:shadow-md
        focus:outline-none focus-visible:ring-2
        focus-visible:ring-primary
        focus-visible:ring-offset-2
        ${
          isDark
            ? "border-slate-700 bg-slate-900/90 text-slate-200 shadow-lg shadow-black/10"
            : "border-slate-200 bg-white/90 text-slate-700 shadow-sm shadow-slate-200/60"
        }
      `}
    >
      {/* Theme Label */}
      <span className="text-xs font-semibold tracking-wide hidden sm:block">
        {isDark ? "Dark mode" : "Light mode"}
      </span>

      {/* Toggle Track */}
      <span
        className={`
          relative flex h-6 w-[44px]
          items-center rounded-full p-1
          transition-colors duration-300
          ${isDark ? "bg-slate-700" : "bg-amber-100"}
        `}
      >
        {/* Sun Icon Background */}
        <span className="absolute left-1.5 text-amber-500">
          <Sun size={12} strokeWidth={2.5} />
        </span>

        {/* Moon Icon Background */}
        <span className="absolute right-1.5 text-slate-300">
          <Moon size={12} strokeWidth={2.5} />
        </span>

        {/* Animated Sliding Knob */}
        <span
          className={`
            relative z-10 flex h-4 w-4
            items-center justify-center
            rounded-full shadow-md
            transition-all duration-300 ease-in-out
            ${
              isDark
                ? "translate-x-[20px] bg-slate-950 text-sky-300"
                : "translate-x-0 bg-white text-amber-500"
            }
          `}
        >
          {isDark ? (
            <Moon size={10} fill="currentColor" />
          ) : (
            <Sun size={10} fill="currentColor" />
          )}
        </span>
      </span>
    </button>
  );
}
