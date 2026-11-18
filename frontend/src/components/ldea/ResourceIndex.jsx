import { useEffect, useRef, useState } from "react";
import { Plus, Search, X, SlidersHorizontal, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import DataTable from "../admin/DataTable";
import { BulkActionsBar } from "./BulkActionsBar";
import { ConfirmDialog } from "../ldea/confirmDialog";
import { exportCsv } from "../../utils/exportCsv";
import { useResourceList } from "../../hooks/useResourceList";

/**
 * @param {object}   props
 * @param {object}   props.resource        - the service object (needs `.bulk()` when selectable)
 * @param {string}   props.title
 * @param {string}   props.subtitle
 * @param {array}    props.columns         - [{ key, label, render?, align? }]
 * @param {array}    props.filters         - [{ key, label, options }]
 * @param {string}   props.newPath         - route to the create form (optional)
 * @param {string}   props.newLabel        - label for the create button
 * @param {boolean}  props.canWrite
 * @param {string}   props.ordering
 * @param {number}   props.pageSize        - must match the API page size
 * @param {function} props.onRowClick      - optional row click handler
 * @param {boolean}  props.selectable      - enables checkboxes and the bulk bar
 * @param {function} props.bulkActions     - ({ selectedRows, selectedIds, clear, reload }) => JSX | null
 * @param {string}   props.exportFilename  - optional CSV filename
 */
export default function ResourceIndex({
  resource,
  title,
  subtitle,
  columns,
  filters = [],
  newPath,
  newLabel = "New record",
  canWrite = false,
  ordering,
  pageSize = 20,
  onRowClick,
  emptyMessage = "No records yet.",
  selectable = false,
  bulkActions = null,
  exportFilename,
}) {
  const {
    page, setPage, search, setSearch,
    filters: filterValues, setFilter,
    data, loading, error, reload,
  } = useResourceList(resource, { ordering });

  const rows = data?.results ?? [];

  /* ---------- selection ---------- */
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkError, setBulkError] = useState("");

  // Selection spans pages, so remember every row we've seen. This lets
  // export and bulk actions use the full row, not just ones on this page.
  const rowCache = useRef(new Map());
  rows.forEach((r) => rowCache.current.set(r.id, r));
  const selectedRows = [...selectedIds].map((id) => rowCache.current.get(id)).filter(Boolean);

  function clear() {
    setSelectedIds(new Set());
    setBulkError("");
  }

  // A new search or filter changes what's visible. Clear the selection so a
  // bulk action can never touch records the user can no longer see.
  const filterKey = JSON.stringify(filterValues);
  useEffect(() => {
    setSelectedIds(new Set());
  }, [search, filterKey]);

  /* ---------- filters ---------- */
  const activeFilters = filters.filter((f) => (filterValues[f.key] ?? "") !== "");
  const isFiltering = Boolean(search) || activeFilters.length > 0;

  function clearAll() {
    setSearch("");
    activeFilters.forEach((f) => setFilter(f.key, ""));
  }

  // With a search or filter active, an empty table means "no matches", not "no data".
  const message = isFiltering ? "No records match your search or filters." : emptyMessage;

  /* ---------- bulk actions ---------- */
  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    setBulkSubmitting(true);
    setBulkError("");
    try {
      const deletedOnPage = rows.filter((r) => selectedIds.has(r.id)).length;
      await resource.bulk({ action: "delete", ids: [...selectedIds] });
      setSelectedIds(new Set());

      // Deleting every row on the last page would leave an empty page behind.
      if (page > 1 && deletedOnPage === rows.length) {
        setPage(page - 1);
      } else {
        reload();
      }
    } catch (err) {
      setBulkError(
        err?.response?.data?.detail || err?.message || "The records could not be deleted. Try again."
      );
    } finally {
      setBulkSubmitting(false);
      setConfirmDelete(false);
    }
  }

  function handleExport() {
    const name =
      exportFilename ??
      `${title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
    // Selected rows (across pages) if any, otherwise the current page.
    exportCsv(name, selectedRows.length > 0 ? selectedRows : rows, columns);
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      {/* Page header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {/* THE COUNT WAS REMOVED FROM HERE */}
          </div>
          {subtitle && <p className="mt-1 text-sm text-base-content/60">{subtitle}</p>}
        </div>

        {canWrite && newPath && (
          <Link to={newPath} className="btn btn-primary btn-sm h-9 rounded-lg px-4 shadow-sm">
            <Plus className="size-4" aria-hidden="true" />
            {newLabel}
          </Link>
        )}
      </header>

      {/* Toolbar */}
      <div className="rounded-2xl border border-base-300 bg-base-100 p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-nowrap lg:items-center lg:justify-between">
          
          {/* LEFT SIDE: Search Bar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <label className="relative block w-full sm:w-64">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-content/40"
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="Search records…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input input-bordered h-10 w-full rounded-lg pl-9 pr-9 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 [&::-webkit-search-cancel-button]:hidden"
                aria-label="Search"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-base-content/50 hover:bg-base-200 hover:text-base-content"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              )}
            </label>

            {filters.length > 0 && (
              <>
                <span className="hidden h-6 w-px bg-base-300 lg:block" aria-hidden="true" />
                <SlidersHorizontal className="hidden size-4 text-base-content/40 lg:block" aria-hidden="true" />
              </>
            )}
          </div>

          {/* RIGHT SIDE: All Filters on the same line */}
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            {filters.map((f) => {
              const active = (filterValues[f.key] ?? "") !== "";
              return (
                <select
                  key={f.key}
                  value={filterValues[f.key] ?? ""}
                  onChange={(e) => setFilter(f.key, e.target.value)}
                  className={
                    "select select-bordered h-10 min-w-[130px] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 " +
                    (active ? "border-primary/60 bg-primary/5 font-medium text-primary" : "text-base-content/70")
                  }
                  aria-label={f.label}
                >
                  <option value="">{f.label}</option>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              );
            })}

            {isFiltering && (
              <button
                type="button"
                onClick={clearAll}
                className="btn btn-ghost btn-sm h-10 rounded-lg text-base-content/70 px-2"
                title="Clear all filters"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Bulk action failure */}
      {bulkError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm"
        >
          <span className="flex items-start gap-2 text-error">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {bulkError}
          </span>
          <button
            type="button"
            onClick={() => setBulkError("")}
            aria-label="Dismiss error"
            className="grid size-6 shrink-0 place-items-center rounded-md text-base-content/50 hover:bg-base-200 hover:text-base-content"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Bulk actions bar (replaces DataTable's built-in one) */}
      {selectable && (
        <BulkActionsBar
          count={selectedIds.size}
          onClear={clear}
          onExport={handleExport}
          onDelete={canWrite && selectedIds.size > 0 ? () => setConfirmDelete(true) : null}
          extraActions={bulkActions ? bulkActions({ selectedRows, selectedIds, clear, reload }) : []}
          submitting={bulkSubmitting}
        />
      )}

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        page={page}
        onPageChange={setPage}
        pageSize={pageSize}
        total={data?.count}
        emptyMessage={message}
        onRowClick={onRowClick}
        selectable={selectable}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        showSelectionBar={false}
      />

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete ${selectedIds.size} record${selectedIds.size === 1 ? "" : "s"}?`}
          body="The records will be marked deleted. They remain in the audit log."
          confirmLabel="Delete"
          submitting={bulkSubmitting}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleBulkDelete}
        />
      )}
    </div>
  );
}