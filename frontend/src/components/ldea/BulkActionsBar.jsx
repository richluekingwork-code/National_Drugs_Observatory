import { X, Download, Trash2 } from "lucide-react";

export function BulkActionsBar({
  count,
  onClear,
  onExport,
  onDelete,
  extraActions = [],
  submitting = false,
}) {
  if (count === 0) return null;

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-3 rounded-[--radius-box] border border-primary/30 bg-primary/5 px-4 py-2.5"
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-primary">
          {count} selected
        </span>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 text-xs text-base-content/60 hover:text-base-content"
        >
          <X className="size-3" aria-hidden="true" />
          Clear
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {extraActions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            disabled={submitting}
            className="btn btn-ghost btn-xs normal-case"
          >
            {a.icon && <a.icon className="size-3.5" aria-hidden="true" />}
            {a.label}
          </button>
        ))}

        {onExport && (
          <button
            type="button"
            onClick={onExport}
            disabled={submitting}
            className="btn btn-ghost btn-xs normal-case"
          >
            <Download className="size-3.5" aria-hidden="true" />
            Export CSV
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={submitting}
            className="btn btn-error btn-xs normal-case"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}