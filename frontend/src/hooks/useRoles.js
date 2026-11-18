import { useAuth } from "../contexts/AuthContext";

/**
 * UI-only role helpers. Never trust these for authorization — the
 * server is the source of truth. These exist to hide controls the
 * user cannot use, so they don't see buttons that will 403.
 */
export function useRoles() {
  const { user, rolesInCurrentInstitution } = useAuth();

  const isSuperuser = Boolean(user?.is_superuser);
  const isInstitutionAdmin = isSuperuser || rolesInCurrentInstitution.includes("institution_admin");

  const canWrite =
    isSuperuser ||
    rolesInCurrentInstitution.some((r) =>
      ["institution_admin", "department_head", "data_officer"].includes(r)
    );

  const canManageUsers = isInstitutionAdmin;
  const canManageMemberships = isInstitutionAdmin;

  return {
    isSuperuser,
    isInstitutionAdmin,
    canWrite,
    canManageUsers,
    canManageMemberships,
  };
}