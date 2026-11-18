import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { apiClient } from "../../api/apiClient";

export function UserMultiSelect({ value = [], onChange, error, label = "Team members" }) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState([]);
  const [open, setOpen] = useState(false);

  // Hydrate selected users from IDs.
  useEffect(() => {
    if (value.length === 0) { setSelected([]); return; }
    apiClient
      .get("/api/users/", { params: { page: 1, ids: value.join(",") } })
      .then(({ data }) => {
        const byId = new Map((data.results ?? []).map((u) => [u.id, u]));
        setSelected(value.map((id) => byId.get(id)).filter(Boolean));
      })
      .catch(() => {});
  }, [value]);

  // Search users.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      apiClient
        .get("/api/users/", { params: { page: 1, search: query } })
        .then(({ data }) => setOptions(data.results ?? []))
        .catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [open, query]);

  function add(u) {
    if (!value.includes(u.id)) {
      onChange([...value, u.id]);
      setSelected((s) => [...s, u]);
    }
    setQuery("");
    setOpen(false);
  }

  function remove(id) {
    onChange(value.filter((v) => v !== id));
    setSelected((s) => s.filter((u) => u.id !== id));
  }

  return (
    <div className="form-control w-full">
      <span className="label pb-1.5">
        <span className="label-text text-sm font-medium text-base-content/80">{label}</span>
      </span>

      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((u) => (
            <span key={u.id} className="badge badge-outline gap-1">
              {u.first_name || u.username} {u.last_name}
              <button
                type="button"
                onClick={() => remove(u.id)}
                className="ml-0.5 hover:text-error"
                aria-label={`Remove ${u.username}`}
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-content/40"
          aria-hidden="true"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search users to add…"
          className={"input input-bordered h-10 w-full pl-9 text-sm " + (error ? "input-error" : "")}
        />

        {open && (
          <ul className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-y-auto rounded-[--radius-box] border border-base-300 bg-base-100 shadow-lg">
            {options.length === 0 && (
              <li className="px-3.5 py-3 text-xs text-base-content/60">No matches.</li>
            )}
            {options
              .filter((u) => !value.includes(u.id))
              .map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => add(u)}
                    className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm hover:bg-base-200"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-medium">{u.first_name || u.username} {u.last_name}</span>
                      <span className="ml-2 text-xs text-base-content/60">{u.email}</span>
                    </span>
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-error" role="alert">{error}</p>}
    </div>
  );
}