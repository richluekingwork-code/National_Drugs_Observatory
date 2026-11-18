// components/ldea/PersonPicker.MultiPersonPicker.jsx
import { useEffect, useId, useRef, useState } from "react";
import { Search, X, Loader2, UserRound, Check } from "lucide-react";
import { ldeaService } from "../../services/ldeaService";

const ROLE_STYLES = {
  suspect: "bg-error/10 text-error",
  victim: "bg-warning/15 text-warning-content",
  witness: "bg-info/10 text-info",
};

/**
 * The list endpoint and the detail endpoint can return different name fields,
 * so try every shape before falling back to the id.
 */
function fullName(p) {
  if (!p) return "";
  const src = p.person && typeof p.person === "object" ? p.person : p;
  const parts = [src.first_name, src.middle_name, src.last_name].filter(Boolean).join(" ");
  return parts || src.full_name || src.name || src.display_name || (p.id ? `Person #${p.id}` : "Unnamed person");
}

function initials(p) {
  const words = fullName(p).replace("#", "").split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

function titleCase(v) {
  return v ? String(v).charAt(0).toUpperCase() + String(v).slice(1) : "";
}

export function PersonPicker({ value, onChange, error, required, role = null, label = "Person", lookup= false }) {
  const listId = useId();
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [active, setActive] = useState(0);
  const svc = lookup ? ldeaService.personLookup : ldeaService.persons;

  // Load the currently-selected person (edit mode or ?person_id= prefill).
  useEffect(() => {
    if (!value) { setSelected(null); return; }
    if (selected && String(selected.id) === String(value)) return;
    let cancelled = false;
    Promise.resolve(svc.get(value))
      .then((p) => !cancelled && setSelected(p))
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Debounced search.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setSearchError(false);

    const t = setTimeout(async () => {
      try {
        const data = await svc.list({
          page: 1, search: query.trim(), role: role ?? undefined,
        });
        if (cancelled) return;
        setOptions(Array.isArray(data) ? data : data?.results ?? []);
        setActive(0);
      } catch {
        if (!cancelled) { setOptions([]); setSearchError(true); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => { cancelled = true; clearTimeout(t); };
  }, [open, query, role, lookup]);

  // Click outside closes.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => boxRef.current && !boxRef.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, query, role, lookup]);

  function choose(p) {
    setSelected(p);
    onChange?.(p.id);
    setOpen(false);
    setQuery("");
  }

  function clear() {
    setSelected(null);
    onChange?.("");
    setQuery("");
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, Math.max(options.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && open && options[active]) {
      e.preventDefault(); // don't submit the form
      choose(options[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showSelected = selected && !open;

  return (
    <div ref={boxRef} className="relative w-full">
      <span className="label pb-1.5">
        <span className="label-text text-[13px] font-medium text-base-content/75">
          {label}
          {required && <span className="ml-0.5 text-error">*</span>}
        </span>
      </span>

      {showSelected ? (
        <div className={"flex items-center gap-3 rounded-xl border bg-base-100 p-3 " + (error ? "border-error/60" : "border-base-300")}>
          <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initials(selected)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{fullName(selected)}</p>
            <p className="truncate text-xs text-base-content/55">
              {[titleCase(selected.role), selected.county].filter(Boolean).join(" · ") || "No details"}
            </p>
          </div>
          <button type="button" onClick={() => setOpen(true)} className="btn btn-ghost btn-xs rounded-md">
            Change
          </button>
          <button type="button" onClick={clear} aria-label="Remove person" className="grid size-7 place-items-center rounded-md text-base-content/50 hover:bg-base-200 hover:text-base-content">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-content/40" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-invalid={error ? "true" : undefined}
            autoComplete="off"
            placeholder="Search by name…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            className={
              "input input-bordered h-10 w-full rounded-lg pl-9 pr-9 text-sm focus:outline-none focus:ring-2 " +
              (error ? "input-error focus:ring-error/25" : "focus:border-primary focus:ring-primary/25")
            }
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-base-content/40" aria-hidden="true" />
          )}
        </div>
      )}

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1.5 max-h-72 w-full overflow-auto rounded-xl border border-base-300 bg-base-100 p-1 shadow-lg"
        >
          {searchError && (
            <li className="px-4 py-5 text-center text-sm text-error">Search failed. Try again.</li>
          )}

          {!loading && !searchError && options.length === 0 && (
            <li className="flex flex-col items-center gap-1.5 px-4 py-6 text-center">
              <UserRound className="size-5 text-base-content/30" aria-hidden="true" />
              <p className="text-sm text-base-content/60">
                {query ? `No one matches "${query}".` : "No people registered yet."}
              </p>
            </li>
          )}

          {options.map((p, i) => {
            const isSelected = String(p.id) === String(value);
            return (
              <li
                key={p.id}
                role="option"
                aria-selected={isSelected}
                onMouseDown={(e) => { e.preventDefault(); choose(p); }}
                onMouseEnter={() => setActive(i)}
                className={"flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 " + (i === active ? "bg-primary/[0.07]" : "")}
              >
                <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-base-200 text-xs font-semibold text-base-content/70">
                  {initials(p)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{fullName(p)}</span>
                  <span className="block truncate text-xs text-base-content/55">
                    {[p.county, p.national_id].filter(Boolean).join(" · ") || "No details"}
                  </span>
                </span>
                {p.role && (
                  <span className={"shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium " + (ROLE_STYLES[p.role] ?? "bg-base-200 text-base-content/70")}>
                    {titleCase(p.role)}
                  </span>
                )}
                {isSelected && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="mt-1.5 text-xs text-error" role="alert">{error}</p>}
    </div>
  );
}

export default PersonPicker;