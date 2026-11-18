export function ChartCard({ title, subtitle, actions, children, className = "" }) {
  return (
    <section
      className={
        "rounded-[--radius-box] border border-base-300 bg-base-100 " +
        className
      }
    >
      <header className="flex items-start justify-between gap-3 border-b border-base-300/60 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-base-content/55">{subtitle}</p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}