import { useEffect, useState } from "react";
import { Search, UserPlus, Trash2, Star } from "lucide-react";
import { ldeaService } from "../../services/ldeaService"; // Make sure this path is correct

const ROLES = [
  { value: "suspect", label: "Suspect" },
  { value: "victim",  label: "Victim" },
  { value: "witness", label: "Witness" },
];

export function ParticipantsEditor({ value = [], onChange, error }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState({});

  // 1. Search API call (Debounced)
  useEffect(() => {
    if (!search || search.length < 2) {
      setResults([]);
      return;
    }
    
    let isMounted = true;
    setLoading(true);
    
    const timer = setTimeout(() => {
      ldeaService.arrests.list({ search, page: 1 })
        .then((res) => {
          if (isMounted) setResults(res.results ?? res);
        })
        .catch(() => {
          if (isMounted) setResults([]);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [search]);

  // 2. Fetch details for already selected participants (so they show up on Edit)
  useEffect(() => {
    const missingIds = value.map(p => p.person_id).filter(id => id && !selectedDetails[id]);
    if (missingIds.length === 0) return;

    Promise.all(missingIds.map(id => ldeaService.arrests.get(id).catch(() => null)))
      .then(results => {
        const newDetails = { ...selectedDetails };
        let hasNew = false;
        results.forEach(res => {
          if (res) {
            newDetails[res.id] = res;
            hasNew = true;
          }
        });
        if (hasNew) setSelectedDetails(newDetails);
      });
  }, [value, selectedDetails]);

  // Helper to format the full name
  const getFullName = (p) => {
    if (!p) return "Loading...";
    return [p.first_name, p.middle_name, p.last_name, p.other_name].filter(Boolean).join(" ");
  };

  function update(index, patch) {
    const next = value.map((p, i) => (i === index ? { ...p, ...patch } : p));
    onChange(next);
  }

  function remove(index) {
    onChange(value.filter((_, i) => i !== index));
  }

  function setPrimary(index) {
    const target = value[index];
    onChange(
      value.map((p, i) => ({
        ...p,
        is_primary: i === index ? true : (p.role === target.role ? false : p.is_primary),
      })),
    );
  }

  function addParticipant(arrest) {
    if (value.some((p) => p.person_id === arrest.id)) return;
    
    setSelectedDetails(prev => ({ ...prev, [arrest.id]: arrest }));
    
    onChange([
      ...value,
      { person_id: arrest.id, role: "suspect", is_primary: false }
    ]);
    setSearch("");
    setShowDropdown(false);
  }

  return (
    <div className="space-y-4">
      {/* Search Box */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-content/40" />
          <input
            type="text"
            placeholder="Search arrested person by name or arrest number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            className="input input-bordered w-full pl-9"
          />
          {loading && (
            <span className="loading loading-spinner loading-xs absolute right-3 top-1/2 -translate-y-1/2" />
          )}
        </div>

        {/* Dropdown Results */}
        {showDropdown && search.length >= 2 && (
          <>
            <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-base-300 bg-base-100 shadow-xl">
              {results.length === 0 && !loading ? (
                <div className="p-4 text-center text-sm text-base-content/60">
                  No arrested persons found.
                </div>
              ) : (
                results.map((a) => {
                  const fullName = getFullName(a);
                  const isSelected = value.some((p) => p.person_id === a.id);
                  
                  return (
                    <button
                      key={a.id}
                      type="button"
                      disabled={isSelected}
                      onClick={() => addParticipant(a)}
                      className="flex w-full items-center gap-3 border-b border-base-200 p-3 text-left last:border-0 hover:bg-base-200 disabled:opacity-50"
                    >
                      {a.photo ? (
                        <img src={a.photo} alt="" className="size-10 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-base-300 text-xs font-semibold">
                          {a.first_name?.[0]}{a.last_name?.[0]}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {a.arrests_number ? <span className="text-primary mr-2">{a.arrests_number}</span> : null}
                          {fullName}
                        </p>
                      </div>
                      
                      {!isSelected && <UserPlus className="size-4 text-primary shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
            <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
          </>
        )}
      </div>

      {/* Selected Participants List */}
      {value.length > 0 && (
        <div className="space-y-3 mt-4 relative z-0">
          {value.map((p, i) => {
            const person = selectedDetails[p.person_id] || {};
            const fullName = getFullName(person);

            return (
              <div key={i} className="rounded-lg border border-base-300 bg-base-100 p-3 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-[1fr_10rem_auto]">
                  
                  {/* Person Display (Image, Number, Name) */}
                  <div className="flex items-center gap-3">
                    {person.photo ? (
                      <img src={person.photo} alt="" className="size-10 rounded-full object-cover ring-1 ring-base-300 shrink-0" />
                    ) : (
                      <div className="grid size-10 shrink-0 place-items-center rounded-full bg-base-200 text-xs font-semibold">
                        {person.first_name?.[0]}{person.last_name?.[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {person.arrests_number ? <span className="text-primary mr-2">{person.arrests_number}</span> : null}
                        {fullName}
                      </p>
                    </div>
                  </div>

                  {/* Role Selector */}
                  <label className="form-control w-full">
                    <select
                      value={p.role}
                      onChange={(e) => update(i, { role: e.target.value, is_primary: false })}
                      className="select select-bordered h-10 text-sm"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </label>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPrimary(i)}
                      title={p.is_primary ? "Primary for this role" : "Mark as primary"}
                      aria-pressed={p.is_primary}
                      className={"btn btn-sm " + (p.is_primary ? "btn-primary" : "btn-ghost")}
                    >
                      <Star className={"size-3.5 " + (p.is_primary ? "fill-current" : "")} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      aria-label="Remove participant"
                      className="btn btn-ghost btn-sm text-error"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="text-xs text-error" role="alert">{error}</p>}
    </div>
  );
}