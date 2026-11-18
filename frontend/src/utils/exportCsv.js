/**
 * Download a list of records as CSV. Uses the DataTable column config
 * so the exported shape matches what the user sees.
 *
 * `csv` on a column, if present, overrides the raw value.
 */
export function exportCsv(filename, rows, columns) {
  const cols = columns.filter((c) => c.key !== "actions");

  const escape = (v) => {
    if (v == null) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };

  const header = cols.map((c) => escape(c.label ?? c.key)).join(",");
  const body = rows
    .map((row) =>
      cols
        .map((c) => escape(c.csv ? c.csv(row) : row[c.key]))
        .join(","),
    )
    .join("\n");

  const csv = `${header}\n${body}`;
  const blob = new Blob(["\ufeff", csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}