import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, LogOut, User as UserIcon, Settings } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useLogout } from "../../hooks/useLogout";

export default function UserMenu() {
  const { user } = useAuth();
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const name =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.username ||
    "Account";
  const initials = (name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 hover:bg-base-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span
          aria-hidden="true"
          className="grid size-8 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
        >
          {initials}
        </span>
        <span className="hidden text-sm font-medium sm:inline">{name}</span>
        <ChevronDown className="size-4 opacity-60" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-[--radius-box] border border-base-300 bg-base-100 shadow-lg"
        >
          <div className="border-b border-base-300 px-3.5 py-3">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-base-content/60">
              {user?.email}
            </p>
          </div>

          <Link
            to="/account"
            role="menuitem"
            className="flex items-center gap-2 px-3.5 py-2.5 text-sm hover:bg-base-200"
            onClick={() => setOpen(false)}
          >
            <UserIcon className="size-4" aria-hidden="true" />
            Account settings
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={logout}
            className="flex w-full items-center gap-2 border-t border-base-300 px-3.5 py-2.5 text-left text-sm text-error hover:bg-error/5"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}