import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, AlertCircle, Inbox } from "lucide-react";

const ALIGN = { left: "text-left", center: "text-center", right: "text-right" };

/**
 * @param {object}   props
 * @param {array}    props.columns        - [{ key, label, render?, align?, className? }]
 * @param {array}    props.rows
 * @param {boolean}  props.loading
 * @param {string}   props.error
 * @param {number}   props.page
 * @param {function} props.onPageChange
 * @param {number}   props.pageSize       - must match the API page size
 * @param {number}   props.total          - total record count (DRF `count`)
 * @param {function} props.onRowClick     - optional, makes rows clickable
 *
 * Selection (optional)
 * @param {boolean}  props.selectable
 * @param {Set}      props.selectedIds        - persists across pages
 * @param {function} props.onSelectionChange  - receives a new Set
 * @param {node}     props.bulkActions        - buttons shown in the selection bar
 */
export default function DataTable({
  columns = [],
  rows = [],
  loading,
  error,
  page = 1,
  onPageChange,
  pageSize = 20,
  total,
  emptyMessage = "No records yet.",
  onRowClick,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  bulkActions,
}) {
  /* ---------- pagination ---------- */
  const hasTotal = typeof total === "number";
  const totalPages = hasTotal ? Math.max(1, Math.ceil(total / pageSize)) : null;
  const hasNext = totalPages ? page < totalPages : rows.length >= pageSize;

  const start = rows.length ? (page - 1) * pageSize + 1 : 0;
  const end = rows.length ? start + rows.length - 1 : 0;

  /* ---------- view state ---------- */
  const showRows = !loading && !error && rows.length > 0;
  const showEmpty = !loading && !error && rows.length === 0;
  const colCount = columns.length + (selectable ? 1 : 0);

  /* ---------- selection ---------- */
  const selectedOnPage = selectable ? rows.filter((r) => selectedIds.has(r.id)).length : 0;
  const allOnPageSelected = rows.length > 0 && selectedOnPage === rows.length;
  const someOnPageSelected = selectedOnPage > 0 && !allOnPageSelected;

  // `indeterminate` can only be set via the DOM property
  const headerCheckboxRef = useRef(null);
  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someOnPageSelected;
    }
  }, [someOnPageSelected]);

  function toggleOne(id) {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    onSelectionChange(next);
  }

  function toggleAllOnPage() {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    rows.forEach((r) => (allOnPageSelected ? next.delete(r.id) : next.add(r.id)));
    onSelectionChange(next);
  }

  function clearSelection() {
    onSelectionChange?.(new Set());
  }

  const selectedCount = selectedIds.size;

  return (
    <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">
      {/* Selection bar */}
      {selectable && selectedCount > 0 && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/20 bg-primary/5 px-5 py-2.5"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm">
            <span className="font-semibold text-primary">{selectedCount.toLocaleString()}</span>{" "}
            <span className="text-base-content/70">selected</span>
          </p>
          <div className="flex items-center gap-2">
            {bulkActions}
            <button type="button" className="btn btn-ghost btn-xs h-8 rounded-lg" onClick={clearSelection}>
              Clear selection
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm" aria-busy={loading || undefined}>
          <thead>
            <tr className="border-b border-base-300 bg-base-200/50">
              {selectable && (
                <th scope="col" className="w-12 px-5 py-3">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={allOnPageSelected}
                    onChange={toggleAllOnPage}
                    disabled={loading || rows.length === 0}
                    aria-label="Select all rows on this page"
                  />
                </th>
              )}
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={
                    "whitespace-nowrap px-5 py-3 text-xs font-semibold text-base-content/60 " +
                    (ALIGN[c.align] ?? ALIGN.left)
                  }
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-base-300/70">
            {/* Loading skeleton */}
            {loading &&
              Array.from({ length: 6 }).map((_, r) => (
                <tr key={`sk-${r}`} aria-hidden="true">
                  {selectable && (
                    <td className="w-12 px-5 py-4">
                      <div className="size-4 animate-pulse rounded bg-base-300/60" />
                    </td>
                  )}
                  {columns.map((c, i) => (
                    <td key={c.key} className="px-5 py-4">
                      <div
                        className="h-3.5 animate-pulse rounded bg-base-300/60"
                        style={{ width: `${55 + ((r * 13 + i * 29) % 40)}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))}

            {/* Error */}
            {!loading && error && (
              <tr>
                <td colSpan={colCount} className="px-5 py-14">
                  <div className="flex flex-col items-center gap-2 text-center" role="alert">
                    <span className="grid size-10 place-items-center rounded-full bg-error/10 text-error">
                      <AlertCircle className="size-5" aria-hidden="true" />
                    </span>
                    <p className="text-sm font-medium">Couldn't load records</p>
                    <p className="max-w-sm text-xs text-base-content/60">{error}</p>
                  </div>
                </td>
              </tr>
            )}

            {/* Empty */}
            {showEmpty && (
              <tr>
                <td colSpan={colCount} className="px-5 py-14">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span className="grid size-10 place-items-center rounded-full bg-base-200 text-base-content/40">
                      <Inbox className="size-5" aria-hidden="true" />
                    </span>
                    <p className="text-sm text-base-content/60">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}

            {/* Rows */}
            {showRows &&
              rows.map((row, i) => {
                const isSelected = selectable && selectedIds.has(row.id);
                return (
                  <tr
                    key={row.id ?? i}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    aria-selected={selectable ? isSelected : undefined}
                    className={
                      "transition-colors " +
                      (isSelected ? "bg-primary/[0.06] hover:bg-primary/[0.09] " : "hover:bg-primary/[0.04] ") +
                      (onRowClick ? "cursor-pointer" : "")
                    }
                  >
                    {selectable && (
                      <td
                        className="w-12 px-5 py-3.5"
                        // keep checkbox clicks from triggering onRowClick
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={isSelected}
                          onChange={() => toggleOne(row.id)}
                          aria-label={`Select row ${row.id ?? i + 1}`}
                        />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={
                          "whitespace-nowrap px-5 py-3.5 " +
                          (ALIGN[c.align] ?? ALIGN.left) +
                          (c.className ? ` ${c.className}` : "")
                        }
                      >
                        {c.render ? c.render(row) : row[c.key] ?? <span className="text-base-content/30">—</span>}
                      </td>
                    ))}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-300 bg-base-200/30 px-5 py-3">
        <p className="text-xs text-base-content/60" aria-live="polite">
          {loading ? (
            "Loading…"
          ) : rows.length === 0 ? (
            "No results"
          ) : hasTotal ? (
            <>
              Showing <span className="font-medium text-base-content">{start}–{end}</span> of{" "}
              <span className="font-medium text-base-content">{total.toLocaleString()}</span>
            </>
          ) : (
            <>
              Showing <span className="font-medium text-base-content">{start}–{end}</span>
            </>
          )}
        </p>

        <nav className="flex items-center gap-1.5" aria-label="Pagination">
          <button
            type="button"
            className="btn btn-outline btn-xs h-8 rounded-lg"
            onClick={() => onPageChange?.(Math.max(1, page - 1))}
            disabled={page <= 1 || loading}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Previous
          </button>

          <span className="min-w-20 px-2 text-center text-xs text-base-content/60">
            Page <span className="font-medium text-base-content">{page}</span>
            {totalPages ? <> of {totalPages}</> : null}
          </span>

          <button
            type="button"
            className="btn btn-outline btn-xs h-8 rounded-lg"
            onClick={() => onPageChange?.(page + 1)}
            disabled={loading || !hasNext}
          >
            Next
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </nav>
      </div>
    </div>
  );
}