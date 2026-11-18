import { useRoles } from "../hooks/useRoles";
import AdminDashboard from "./AdminDashboard";
import DashboardPage from "./DashboardPage";
import SuperAdminPage from "./admin/SuperAdminPage";

export default function SwitcherDashboard() {
  const { canManageUsers, isSuperuser } = useRoles();

  if (isSuperuser) return <SuperAdminPage />;
  if (canManageUsers) return <AdminDashboard />;
  return <DashboardPage />;
}