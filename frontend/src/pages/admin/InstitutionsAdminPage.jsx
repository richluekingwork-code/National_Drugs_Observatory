import { useCallback, useEffect, useState } from "react";
import { Building2, Plus, Sprout, AlertCircle, Pencil } from "lucide-react";
import { adminService } from "../../services/adminService";
import InstitutionDialog, { labelOf } from "./InstitutionDialog";

export default function InstitutionsAdminPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // null | "new" | institution
  const [seeding, setSeeding] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.listInstitutions();
      setRows(Array.isArray(data) ? data : data?.results ?? []);
    } catch {
      setError("Could not load institutions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  async function handleSeed() {
    setSeeding(true);
    setError(null);
    try {
      await adminService.seedInstitutions();
      await reload();
    } catch (err) {
      setError(err?.response?.data?.detail ?? "Could not seed institutions.");
    } finally {
      setSeeding(false);
    }
  }

  const existingCodes = rows.map((r) => r.code);
  const canCreateMore = existingCodes.length < 5;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Institutions</h1>
          <p className="mt-0.5 text-sm text-base-content/60">
            The are one Agency and four Ministries that participate in the observatory.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSeed}
            disabled={seeding}
            className="btn btn-ghost btn-sm normal-case"
          >
            <Sprout className="size-4" aria-hidden="true" />
            {seeding ? "Seeding…" : "Seed defaults"}
          </button>
          <button
            type="button"
            onClick={() => setEditing("new")}
            disabled={!canCreateMore}
            className="btn btn-primary btn-sm normal-case"
            title={canCreateMore ? undefined : "All five institutions already exist"}
          >
            <Plus className="size-4" aria-hidden="true" />
            New institution
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading && Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl border border-base-300 bg-base-200/50" />
        ))}

        {!loading && rows.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-base-300 bg-base-200/30 px-6 py-14 text-center">
            <Building2 className="mx-auto mb-3 size-8 text-base-content/30" aria-hidden="true" />
            <p className="text-sm text-base-content/70">
              No institutions yet.
            </p>
            <p className="mt-1 text-xs text-base-content/50">
              Click <strong>Seed defaults</strong> to create the five fixed institutions, or <strong>New institution</strong> to add one.
            </p>
          </div>
        )}

        {!loading && rows.map((inst) => (
          <article 
            key={inst.id} 
            className="group flex flex-col rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-content">
                <Building2 className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs font-semibold text-base-content/60">{inst.code}</p>
                <h2 className="truncate text-sm font-semibold">{labelOf(inst.code)}</h2>
              </div>
              <span className={`badge badge-sm ${inst.is_active ? "badge-success badge-soft" : "badge-ghost"}`}>
                {inst.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            {/* Description Block */}
            {inst.description ? (
              <div className="group/desc relative mt-4 flex-1">
                {/* The Box */}
                <div className="h-full cursor-help rounded-xl border border-base-300/50 bg-base-200/40 p-3.5 transition-all duration-200 hover:border-primary/30 hover:bg-base-200/80 hover:shadow-sm">
                  <p className="line-clamp-3 text-xs leading-relaxed text-base-content/75 transition-colors group-hover/desc:text-base-content">
                    {inst.description}
                  </p>
                </div>

                {/* The Custom Tooltip Pop-up */}
                <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 scale-95 opacity-0 transition-all duration-200 group-hover/desc:scale-100 group-hover/desc:opacity-100">
                  <div className="relative rounded-lg bg-neutral px-3 py-2 text-xs leading-relaxed text-neutral-content shadow-xl">
                    {inst.description}
                    {/* The little triangle arrow pointing down */}
                    <div className="absolute left-1/2 top-full -mt-px h-0 w-0 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-neutral" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-1 items-center justify-center rounded-xl border border-dashed border-base-300/60 bg-base-200/20 p-3.5">
                <p className="text-xs italic text-base-content/40">No description provided.</p>
              </div>
            )}

            <div className="mt-5 flex justify-end border-t border-base-300/60 pt-3">
              <button
                type="button"
                onClick={() => setEditing(inst)}
                className="btn btn-ghost btn-xs normal-case text-primary opacity-80 transition-opacity hover:bg-primary/10 hover:opacity-100"
              >
                <Pencil className="size-3.5" aria-hidden="true" />
                Edit
              </button>
            </div>
          </article>
        ))}
      </div>

      {editing && (
        <InstitutionDialog
          institution={editing === "new" ? null : editing}
          existingCodes={existingCodes}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
        />
      )}
    </div>
  );
}