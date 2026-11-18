import {Search} from "lucide-react";

export function formatRole(role) {
    return (role || "unassigned")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

const ROLE_TONES = {
    institution_admin: "bg-primary/10 text-primary ring-primary/25",
    department_head: "bg-secondary/10 text-secondary ring-secondary/25",
    data_officer: "bg-info/10 text-info ring-info/25",
    analyst: "bg-accent/10 text-accent ring-accent/25",
    viewer: "bg-base-200 text-base-content/70 ring-base-300",
};

export function RoleBadge({role}) {
    return (
        <span
            className={
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset " +
                (ROLE_TONES[role] ?? ROLE_TONES.viewer)
            }
        >
      {formatRole(role)}
    </span>
    );
}

export function StatusPill({active}) {
    return (
        <span
            className={
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset " +
                (active
                    ? "bg-success/10 text-success ring-success/25"
                    : "bg-base-200 text-base-content/60 ring-base-300")
            }
        >
      <span
          aria-hidden="true"
          className={"size-1.5 rounded-full " + (active ? "bg-success" : "bg-base-content/30")}
      />
            {active ? "Active" : "Inactive"}
    </span>
    );
}

export function Avatar({name = "", size = "size-9"}) {
    const initials =
        name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((s) => s[0])
            .join("")
            .toUpperCase() || "?";
    return (
        <span
            aria-hidden="true"
            className={`grid ${size} shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary`}
        >
      {initials}
    </span>
    );
}

export function UserCell({name, email}) {
    return (
        <div className="flex min-w-0 items-center gap-3">
            <Avatar name={name}/>
            <div className="min-w-0">
                <p className="truncate font-medium">{name}</p>
                <p className="truncate text-xs text-base-content/60">{email || "—"}</p>
            </div>
        </div>
    );
}

export function SearchInput({value, onChange, placeholder, label}) {
    return (
        <label className="relative block w-full max-w-sm">
            <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-content/40"
                aria-hidden="true"
            />
            <input
                type="search"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                aria-label={label}
                className="input input-bordered h-10 w-full rounded-xl bg-base-100 pl-9 text-sm"
            />
        </label>
    );
}

export function StatCard({icon: Icon, label, value, hint, loading}) {
    return (
        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-base-content/55">{label}</p>
                <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden="true"/>
        </span>
            </div>
            {loading ? (
                <div className="mt-3 h-7 w-16 animate-pulse rounded bg-base-300/60"/>
            ) : (
                <p className="mt-2 truncate text-2xl font-semibold tracking-tight tabular-nums">
                    {value ?? "—"}
                </p>
            )}
            {hint && <p className="mt-1 truncate text-xs text-base-content/50">{hint}</p>}
        </div>
    );
}