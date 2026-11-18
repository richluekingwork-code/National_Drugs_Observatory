import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, X } from "lucide-react";
import ResourceIndex from "../../../components/ldea/ResourceIndex";
import { ldeaService } from "../../../services/ldeaService";
import { useRoles } from "../../../hooks/useRoles";

export default function DrugTypesPage() {
  const { canWrite } = useRoles();
  const [preview, setPreview] = useState(null); // { src, alt }

  useEffect(() => {
    if (!preview) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") setPreview(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [preview]);

  const columns = [
    {
      key: "name",
      label: "Drug",
      width: "40%",
      render: (d) => (
        <div className="flex items-center gap-2.5 min-w-0">
          {d.photo ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPreview({ src: d.photo, alt: d.name });
              }}
              className="group relative shrink-0 cursor-zoom-in rounded-[--radius-field] focus:outline-none focus:ring-2 focus:ring-primary/50"
              title="Click to enlarge"
              aria-label={`Preview ${d.name}`}
            >
              <img
                src={d.photo}
                alt=""
                className="size-8 rounded-[--radius-field] border border-base-300 object-cover transition group-hover:ring-2 group-hover:ring-primary/40"
              />
            </button>
          ) : (
            <span
              aria-hidden="true"
              className="grid size-8 shrink-0 place-items-center rounded-[--radius-field] bg-base-200 text-xs font-medium text-base-content/50"
            >
              {d.name?.[0]?.toUpperCase()}
            </span>
          )}
          <Link
            to={`/drug-types/${d.id}/edit`}
            className="min-w-0 hover:text-primary"
          >
            <span className="block truncate font-medium">{d.name}</span>
            {/* FIXED: Show only first 3 words with a tooltip for the full name */}
            <span 
              className="block truncate text-xs text-base-content/60"
              title={d.category || "Uncategorized"}
            >
              {d.category 
                ? d.category.trim().split(/\s+/).slice(0, 3).join(" ") 
                : "Uncategorized"}
            </span>
          </Link>
        </div>
      ),
    },
    {
      key: "common_units",
      label: "Common units",
      width: "12%",
      render: (d) =>
        d.common_units ? (
          <span className="inline-block max-w-full truncate whitespace-nowrap badge badge-sm badge-ghost">
            {d.common_units}
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "description",
      label: "Description",
      width: "38%",
      render: (d) => (
        <span className="line-clamp-1 text-sm text-base-content/70">
          {d.description || "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      width: "10%",
      align: "right",
      render: (d) =>
        canWrite && (
          <Link
            to={`/drug-types/${d.id}/edit`}
            className="btn btn-ghost btn-xs gap-1 normal-case whitespace-nowrap text-primary"
          >
            <Pencil className="size-3.5" /> Edit
          </Link>
        ),
    },
  ];

  return (
    <>
      <ResourceIndex
        resource={ldeaService.drugTypes}
        title="Drug types"
        subtitle="Reference list shared across the observatory."
        columns={columns}
        newPath="/drug-types/new"
        newLabel="Add drug type"
        canWrite={canWrite}
        ordering="name"
        emptyMessage="No drug types yet."
        selectable
        exportFilename={`Types-${new Date().toISOString().slice(0, 10)}.csv`}
      />

      {preview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={preview.alt ? `Preview of ${preview.alt}` : "Image preview"}
          className="fixed inset-0 z-50 flex items-center justify-center bg-base-content/70 p-4 backdrop-blur-sm"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[92vw] overflow-hidden rounded-xl bg-base-100 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-base-100/90 text-base-content shadow-md transition hover:bg-base-100"
              aria-label="Close preview"
            >
              <X className="size-5" />
            </button>
            <img
              src={preview.src}
              alt={preview.alt || ""}
              className="max-h-[85vh] w-auto object-contain"
            />
            {preview.alt && (
              <div className="border-t border-base-300 bg-base-100 px-4 py-2 text-center text-sm font-medium">
                {preview.alt}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}