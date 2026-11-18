export function ChartTooltip({ active, payload, label, labelFormatter, valueFormatter }) {
  if (!active || !payload?.length) return null;

  const title = labelFormatter ? labelFormatter(label) : label;

  return (
    <div className="pointer-events-none rounded-[--radius-field] border border-base-300 bg-base-100/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm">
      {title && (
        <p className="mb-1.5 font-medium text-base-content/80">{title}</p>
      )}
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li key={entry.dataKey} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-base-content/70">
              <span
                aria-hidden="true"
                className="size-2 rounded-full"
                style={{ background: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-medium tabular-nums">
              {valueFormatter ? valueFormatter(entry.value, entry) : entry.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}