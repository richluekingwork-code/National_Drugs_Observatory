export function TabBar({ tabs, active, onChange }) {
  return (
    <div
      role="tablist"
      className="inline-flex items-center gap-1 rounded-full border border-base-300 bg-base-100 p-1"
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(id)}
            className={
              "inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition-colors " +
              (isActive
                ? "bg-primary text-primary-content"
                : "text-base-content/65 hover:text-base-content")
            }
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}