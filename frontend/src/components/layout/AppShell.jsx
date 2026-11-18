import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AppHeader from "./AppHeader";
import AppSidebar, { MobileSidebar } from "./AppSidebar";
import NetworkField from "./NetworkField";

export default function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const { pathname } = useLocation();

  // Close the drawer on any route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <div className="relative isolate min-h-dvh bg-base-100 text-base-content transition-colors duration-300">
      {/* Global animated background */}
      <NetworkField
        mode="auto"
        showLogos={true}
        surface="bg-base-100"
        motion="on"
      />

      {/* Application content */}
      <div className="relative z-10 min-h-dvh">
        {/* Application Header */}
        <AppHeader 
          onMenuClick={() => setMobileNavOpen((o) => !o)} 
          mobileNavOpen={mobileNavOpen}
        />

        <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-6 lg:px-8">
          {/* Sidebar */}
          <AppSidebar />

          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile drawer */}
      <MobileSidebar open={mobileNavOpen} onClose={closeMobileNav} />
    </div>
  );
}