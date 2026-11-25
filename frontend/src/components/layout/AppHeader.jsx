import { Link } from "react-router-dom";
import { Menu, Building2 } from "lucide-react";
import UserMenu from "./UserMenu";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../../contexts/AuthContext";
import { ScopeBadge } from "./ScopeBadge"; 

// ❌ NO IMAGE IMPORT NEEDED HERE

export default function AppHeader({
  onMenuClick,
  mobileNavOpen,
  theme,
  onThemeToggle,
}) {
  const { currentMembership } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-base-300 bg-base-100/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 lg:px-8">
        
        {/* Brand and mobile navigation */}
        <div className="flex min-w-0 items-center gap-3">

          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={mobileNavOpen}
            aria-haspopup="dialog"
            onClick={onMenuClick}
            className="btn btn-ghost btn-square btn-sm lg:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>

          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            
            {/* ✅ USE THE PUBLIC FOLDER PATH HERE */}
            <img 
              src="/logo.png" 
              alt="NDO Logo" 
              className="w-10 h-10 object-contain rounded-xl shadow-sm" 
            />
            
            <span className="hidden sm:block">
              <span className="block text-sm font-bold tracking-tight text-base-content">Observatory</span>
              <span className="block text-[10px] tracking-wide text-base-content/60">NATIONAL DRUG OBSERVATORY</span>
            </span>
          </Link>
        </div>

        {/* Right side: Institution, Scope, Toggle, User */}
        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
          
          {currentMembership && (
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-colors text-sm font-semibold text-primary">
              <Building2 size={16} />
              {currentMembership?.institution?.code || "MOYS"}
            </button>
          )}

          {currentMembership && (
            <span className="hidden md:block">
              <ScopeBadge membership={currentMembership} />
            </span>
          )}

          <div className="hidden h-7 w-px bg-base-300 sm:block" aria-hidden="true" />
          <ThemeToggle />
          <div className="hidden h-7 w-px bg-base-300 sm:block" aria-hidden="true" />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}