
import { useEffect, useState } from "react";
import { X, UserPlus } from "lucide-react";
import { PersonPicker } from "../ldea/PersonPicker";
import { ldeaService } from "../../services/ldeaService";

export function MultiPersonPicker({
  value = [],
  onChange,
  error,
  label = "Persons",
}) {
  const [selected, setSelected] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  // Normalize incoming IDs so strings and numbers compare consistently.
  const ids = (Array.isArray(value) ? value : [])
    .filter((id) => id !== null && id !== undefined && id !== "")
    .map(String);

  // Load selected people when editing an existing record.
  useEffect(() => {
    let cancelled = false;

    async function loadPeople() {
      const missingIds = ids.filter(
        (id) => !selected.some((person) => String(person.id) === id)
      );

      if (missingIds.length === 0) {
        // Remove chips that are no longer in the form value.
        setSelected((current) =>
          current.filter((person) => ids.includes(String(person.id)))
        );
        return;
      }

      const results = await Promise.all(
        missingIds.map((id) =>
          ldeaService.personLookup.get(id).catch((error) => {
            console.error(`Failed to load person ${id}:`, error);
            return null;
          })
        )
      );

      if (cancelled) return;

      setSelected((current) => {
        const merged = [...current];

        results.filter(Boolean).forEach((person) => {
          if (!merged.some((p) => String(p.id) === String(person.id))) {
            merged.push(person);
          }
        });

        return merged.filter((person) =>
          ids.includes(String(person.id))
        );
      });
    }

    loadPeople();

    return () => {
      cancelled = true;
    };
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  function add(personId) {
    if (personId === null || personId === undefined || personId === "") {
      return;
    }

    const id = String(personId);

    if (!ids.includes(id)) {
      onChange?.([...value, personId]);
    }

    setShowPicker(false);
  }

  function remove(personId) {
    const id = String(personId);

    onChange?.(
      value.filter((item) => String(item) !== id)
    );

    setSelected((current) =>
      current.filter((person) => String(person.id) !== id)
    );
  }

  return (
    <div className="form-control w-full">
      <span className="label pb-1.5">
        <span className="label-text text-sm font-medium text-base-content/80">
          {label}
        </span>
      </span>

      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((person) => (
            <span
              key={person.id}
              className="badge badge-outline gap-1"
            >
              {[
                person.first_name,
                person.middle_name,
                person.last_name,
              ]
                .filter(Boolean)
                .join(" ") || person.full_name || `Person #${person.id}`}

              <button
                type="button"
                onClick={() => remove(person.id)}
                className="ml-0.5 hover:text-error"
                aria-label={`Remove person ${person.first_name || person.id}`}
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}

      {!showPicker ? (
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="btn btn-ghost btn-sm w-fit normal-case"
        >
          <UserPlus className="size-4" aria-hidden="true" />
          Add person
        </button>
      ) : (
        <div className="rounded-xl border border-base-300 bg-base-100 p-3">
          <PersonPicker
            value=""
            onChange={add}
            lookup={true}
            label="Search registered persons"
          />

          <button
            type="button"
            onClick={() => setShowPicker(false)}
            className="btn btn-ghost btn-xs mt-2 normal-case"
          >
            Cancel
          </button>
        </div>
      )}

      {error && (
        <p className="mt-1 text-xs text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default MultiPersonPicker;
