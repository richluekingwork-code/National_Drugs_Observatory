import { ShieldCheck, Activity, Layers } from "lucide-react";

const FEATURES = [
  { icon: Layers,   text: "Four Ministries and One Agency, on one shared record" },
  { icon: Activity, text: "Live seizure and arrest analytics" },
  { icon: ShieldCheck, text: "Audited, role-scoped access" },
];

export default function AuthLayout({ children }) {
  // h-dvh and overflow-hidden lock the screen so it never scrolls
  return (
    <div className="h-dvh w-full overflow-hidden grid lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] bg-base-100 text-base-content">
      <BrandPanel />
      
      <main className="flex h-full items-center justify-center px-6 py-6 sm:px-10 lg:px-16 overflow-y-auto">
        <div className="w-full max-w-[26rem]">{children}</div>
      </main>
    </div>
  );
}

function BrandPanel() {
  return (
    <aside className="relative hidden lg:flex flex-col justify-center overflow-hidden p-12 xl:p-16 text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(155deg, oklch(21% 0.06 275) 0%, oklch(28% 0.14 272) 45%, oklch(24% 0.09 262) 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-60 motion-safe:animate-mesh"
        style={{
          background:
            "radial-gradient(60% 50% at 20% 15%, oklch(62% 0.20 275 / 0.55), transparent 60%)," +
            "radial-gradient(50% 45% at 85% 80%, oklch(62% 0.16 200 / 0.45), transparent 60%)," +
            "radial-gradient(40% 40% at 60% 40%, oklch(70% 0.14 320 / 0.35), transparent 65%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 mix-blend-overlay opacity-[0.06]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-md mx-auto">
        <LogoMark />

        <h1 className="mt-6 text-2xl font-semibold tracking-wide text-white sm:text-3xl">
          National Drug Observatory
        </h1>

        <p className="mt-2 text-sm text-white/70 sm:text-base">
          A single, verified view of Liberia&rsquo;s drug response.
        </p>

        <ul className="mt-8 space-y-3 text-left">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-white/80">
              <span className="grid size-8 place-items-center rounded-full bg-white/10 ring-1 ring-white/15">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="text-sm">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <footer className="absolute bottom-6 left-0 right-0 z-10 text-center text-xs text-white/50">
        Authorized personnel only. All activity is logged.
      </footer>
    </aside>
  );
}

function LogoMark() {
  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full scale-150" aria-hidden="true" />
      
      <img
        src="/assets/logo-2.png"
        alt="National Drug Observatory"
        decoding="async"
        className="relative z-10 h-36 w-auto object-contain drop-shadow-2xl sm:h-44 lg:h-48"
        // ADD THIS LINE:
        onError={(e) => console.error("Image failed to load. Looked for:", e.target.src)}
      />
    </div>
  );
}


