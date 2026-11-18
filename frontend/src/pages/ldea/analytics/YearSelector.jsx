import { ChevronDown, Calendar } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function YearSelector({ years, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const current = value ?? "All time";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-8 items-center gap-2 rounded-full border border-base-300 bg-base-100 px-3 text-xs font-medium hover:bg-base-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        <Calendar className="size-3.5 text-base-content/55" aria-hidden="true" />
        <span className="tabular-nums">{current}</span>
        <ChevronDown className="size-3.5 opacity-50" aria-hidden="true" />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-30 mt-1.5 min-w-[8rem] overflow-hidden rounded-[--radius-box] border border-base-300 bg-base-100 py-1 shadow-lg"
        >
          <li>
            <button
              type="button"
              role="option"
              aria-selected={value === null}
              onClick={() => { onChange(null); setOpen(false); }}
              className={
                "flex w-full items-center px-3 py-1.5 text-left text-xs hover:bg-base-200 " +
                (value === null ? "font-medium text-primary" : "")
              }
            >
              All time
            </button>
          </li>
          {years.map((y) => (
            <li key={y}>
              <button
                type="button"
                role="option"
                aria-selected={value === y}
                onClick={() => { onChange(y); setOpen(false); }}
                className={
                  "flex w-full items-center px-3 py-1.5 text-left text-xs tabular-nums hover:bg-base-200 " +
                  (value === y ? "font-medium text-primary" : "")
                }
              >
                {y}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}