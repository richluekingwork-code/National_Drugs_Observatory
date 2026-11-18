import {useCallback, useState} from "react";
import {Search} from "lucide-react";
import DataTable from "../../components/admin/DataTable.jsx";
import EditMembershipDialog from "../../components/admin/EditMemberShipDialog.jsx";
import {adminService} from "../../services/adminService.js";
import {useAuth} from "../../contexts/AuthContext.jsx";
import {usePaginatedResource} from "../../hooks/usePaginatedResource.js";

// A membership is only effectively active when the account itself is active.
// user_is_active comes from the API; if it's missing, fall back to the membership flag.
const accountActive = (m) => m.user_is_active !== false;

export default function MembershipsAdminPage({ onChanged, institutionId }) {
    const {currentInstitutionId} = useAuth();
    const scopeId = institutionId !== undefined ? institutionId : currentInstitutionId;
    const [editing, setEditing] = useState(null);

    const fetcher = useCallback(
        ({page, search}) =>
            adminService.listMemberships({page, search, institutionId: scopeId}),
        [scopeId],
    );

    const {
        page, setPage, search, setSearch, data, loading, error, reload,
    } = usePaginatedResource(fetcher);

    const columns = [
        {
            key: "user", label: "User", render: (m) => (
                <div className={`min-w-0 ${accountActive(m) ? "" : "opacity-60"}`}>
                    <p className="truncate font-medium">{m.username}</p>
                    <p className="truncate text-xs text-base-content/60">{m.user_email}</p>
                </div>
            )
        },
        {key: "institution", label: "Institution", render: (m) => m.institution?.name ?? "—"},
        {
            key: "role", label: "Role", render: (m) => (
                <span className="badge badge-outline badge-sm">{m.role}</span>
            )
        },
        {
            key: "status", label: "Status", render: (m) => {
                if (!accountActive(m)) {
                    return (
                        <span
                            className="badge badge-error badge-outline badge-sm"
                            title="This user's account is deactivated"
                        >
                            Account inactive
                        </span>
                    );
                }
                return m.is_active
                    ? <span className="badge badge-success badge-sm">Active</span>
                    : <span className="badge badge-ghost badge-sm">Inactive</span>;
            }
        },
        {
            key: "actions", label: "", render: (m) => {
                const locked = !accountActive(m);
                return (
                    <button
                        type="button"
                        onClick={() => setEditing(m)}
                        disabled={locked}
                        title={locked ? "Reactivate this user before editing their membership" : undefined}
                        className="btn btn-ghost btn-xs normal-case"
                    >
                        Edit
                    </button>
                );
            }
        },
    ];

    return (
        <div className="space-y-5">
            <header>
                <h1 className="text-xl font-semibold tracking-tight">Memberships</h1>
                <p className="mt-0.5 text-sm text-base-content/60">
                    Roles and status for users in this institution.
                </p>
            </header>

            <label className="relative block max-w-sm">
                <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-content/40"
                    aria-hidden="true"
                />
                <input
                    type="search"
                    placeholder="Search users"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    className="input input-bordered h-10 w-full pl-9 text-sm"
                    aria-label="Search memberships"
                />
            </label>

            <DataTable
                columns={columns}
                rows={data?.results ?? []}
                loading={loading}
                error={error}
                page={page}
                onPageChange={setPage}
                emptyMessage="No memberships in this institution yet."
            />

            {editing && (
                <EditMembershipDialog
                    membership={editing}
                    onClose={() => setEditing(null)}
                    onSaved={() => {
                        setEditing(null);
                        reload();
                        onChanged?.();
                    }}
                />
            )}
        </div>
    );
}