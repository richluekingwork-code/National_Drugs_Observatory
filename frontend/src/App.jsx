import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import RequireRole from "./routes/RequireRole";

// import NetworkField from "./components/NetworkField"; // <--- ADDED THIS

import LoginPage from "./pages/LoginPage";
import SwitcherDashboard from "./pages/SwitcherDashboard";
import ProfilePage from "./pages/ProfilePage";

import UsersAdminPage from "./pages/admin/UsersAdminPage";
import MembershipsAdminPage from "./pages/admin/MembershipAdminPage";
import InstitutionsAdminPage from "./pages/admin/InstitutionsAdminPage";
import AuditLogPage from "./pages/admin/AuditLogPage";
import SuperAdminPage from "./pages/admin/SuperAdminPage";

// LDEA Imports
import SeizuresPage from "./pages/ldea/Seizures/SeizuresPage";
import SeizureDetailPage from "./pages/ldea/Seizures/SeizureDetailPage";
import SeizureFormPage from "./pages/ldea/Seizures/SeizureFormPage";
import PersonsPage from "./pages/ldea/Persons/PersonsPage";
import PersonDetailPage from "./pages/ldea/Persons/PersonDetailPage";
import PersonFormPage from "./pages/ldea/Persons/PersonFormPage";
import PersonTimelinePage from "./pages/ldea/Persons/PersonTimeLinePage";
import ArrestsPage from "./pages/ldea/arrests/ArrestsPage";
import ArrestDetailPage from "./pages/ldea/arrests/ArrestDetailPage";
import ArrestFormPage from "./pages/ldea/arrests/ArrestFormPage";
import VictimHistoriesPage from "./pages/ldea/VictimHistory/VictimHistoriesPage";
import VictimDetailPage from "./pages/ldea/VictimHistory/VictimDetailPage";
import VictimHistoryFormPage from "./pages/ldea/VictimHistory/VictimHistoryFormPage";
import CasesPage from "./pages/ldea/cases/CasesPage";
import CaseDetailPage from "./pages/ldea/cases/CaseDetailPage";
import CaseFormPage from "./pages/ldea/cases/CaseFormPage";
import RaidsPage from "./pages/ldea/raids/RaidsPage";
import RaidDetailPage from "./pages/ldea/raids/RaidDetailPage";
import RaidFormPage from "./pages/ldea/raids/RaidFormPage";
import DrugTypesPage from "./pages/ldea/drugTypes/DrugTypesPage";
import DrugTypeFormPage from "./pages/ldea/drugTypes/DrugTypeFormPage";
import AnalyticsPage from "./pages/ldea/analytics/AnalyticsPage";

// MOG Imports (Cleaned)
import MOGAnalyticsPage from "./pages/mog/analytics/AnalyticsPage";
import MOGPeoplePage from "./pages/mog/PeoplePage";
import LinkedPersonPage from "./pages/mog/LinkedPersonPage";
import ChildTrackingPage from "./pages/mog/ChildTrackingPage";

// MOH Imports
import DemandReductionsPage from "./pages/moh/demandReductions/DemandReductionsPage";
import DemandReductionDetailPage from "./pages/moh/demandReductions/DemandReductionDetailPage";
import DemandReductionFormPage from "./pages/moh/demandReductions/DemandReductionFormPage";
import PreventionPage from "./pages/moh/prevention/PreventionPage";
import PreventionDetailPage from "./pages/moh/prevention/PreventionDetailPage";
import PreventionFormPage from "./pages/moh/prevention/PreventionFormPage";
import FacilitiesPage from "./pages/moh/facilities/FacilitiesPage";
import FacilityDetailPage from "./pages/moh/facilities/FacilityDetailPage";
import FacilityFormPage from "./pages/moh/facilities/FacilityFormPage";
import IncomingReferralsPage from "./pages/moh/referrals/IncomingReferralsPage";
import MOHAnalyticsPage from "./pages/moh/analytics/AnalyticsPage";
import MOHBeneficiaryPage from "./pages/moh/beneficiary/VictimsPage";
import MOHVictimFormPage from "./pages/moh/beneficiary/MOHVictimFormPage";

// MOJ Imports
import MOJDashboardPage from "./pages/moj/MOJDashboardPage";
import MOJAnalyticsPage from "./pages/moj/analytics/MOJAnalyticsPage";
import MOJCasesPage from "./pages/moj/cases/MOJCasesPage";
import MOJCaseDetailPage from "./pages/moj/cases/MOJCaseDetailPage";
import MOJHearingsPage from "./pages/moj/hearings/MOJHearingsPage";
import MOJWorkloadsPage from "./pages/moj/workloads/MOJWorkloadsPage";
import MOJFinesPage from "./pages/moj/fines/MOJFinesPage";

// MOY&S Imports
import MOYSDashboardPage from "./pages/moys/Dashboard/MOYSDashboardPage";
import MOYSBeneficiariesPage from "./pages/moys/Beneficiary/BeneficiariesPage";
import MOYSBeneficiaryDetailPage from "./pages/moys/Beneficiary/BeneficiaryDetailPage";
import MOYSAnalyticsPage from "./pages/moys/Analytics/MOYSAnalyticsPage";

// Layout & Styles
import AppShell from "./components/layout/AppShell";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
{/*          */}{/* GLOBAL BACKGROUND */}
{/*         <NetworkField/> */}

        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              
              {/* Workspace */}
              <Route path="/" element={<SwitcherDashboard />} />
              <Route path="/account" element={<ProfilePage />} />
              <Route path="/superadmin" element={<SuperAdminPage />} />

              {/* Admin Routes */}
              <Route element={<RequireRole role="canManageUsers" />}>
                <Route path="/admin/users" element={<UsersAdminPage />} />
                 <Route path="/admin/audit-logs" element={<AuditLogPage />} />
              </Route>
              <Route element={<RequireRole role="canManageMemberships" />}>
                <Route path="/admin/memberships" element={<MembershipsAdminPage />} />
              </Route>
              <Route element={<RequireRole role="isSuperuser" />}>
                <Route path="/admin/institutions" element={<InstitutionsAdminPage />} />
              </Route>

              {/* ================= LDEA ROUTES ================= */}
              <Route path="/seizures" element={<SeizuresPage />} />
              <Route path="/seizures/new" element={<SeizureFormPage />} />
              <Route path="/seizures/:id" element={<SeizureDetailPage />} />
              <Route path="/seizures/:id/edit" element={<SeizureFormPage />} />
              
              <Route path="/persons" element={<PersonsPage />} />
              <Route path="/persons/new" element={<PersonFormPage />} />
              <Route path="/persons/:id" element={<PersonDetailPage />} />
              <Route path="/persons/:id/edit" element={<PersonFormPage />} />
              <Route path="/persons/:id/timeline" element={<PersonTimelinePage />} />

              <Route path="/arrests" element={<ArrestsPage />} />
              <Route path="/arrests/new" element={<ArrestFormPage />} />
              <Route path="/arrests/:id" element={<ArrestDetailPage />} />
              <Route path="/arrests/:id/edit" element={<ArrestFormPage />} />

              <Route path="/victim-histories" element={<VictimHistoriesPage />} />
              <Route path="/victim-histories/new" element={<VictimHistoryFormPage />} />
              <Route path="/victim-histories/:id" element={<VictimDetailPage />} />
              <Route path="/victim-histories/:id/edit" element={<VictimHistoryFormPage />} />

              <Route path="/cases" element={<CasesPage />} />
              <Route path="/cases/new" element={<CaseFormPage />} />
              <Route path="/cases/:id" element={<CaseDetailPage />} />
              <Route path="/cases/:id/edit" element={<CaseFormPage />} />

              <Route path="/raids" element={<RaidsPage />} />
              <Route path="/raids/new" element={<RaidFormPage />} />
              <Route path="/raids/:id" element={<RaidDetailPage />} />
              <Route path="/raids/:id/edit" element={<RaidFormPage />} />

              <Route path="/drug-types" element={<DrugTypesPage />} />
              <Route path="/drug-types/new" element={<DrugTypeFormPage />} />
              <Route path="/drug-types/:id/edit" element={<DrugTypeFormPage />} />

              <Route path="/analytics" element={<AnalyticsPage />} />

              {/* ================= MOG ROUTES ================= */}
              <Route path="/mog/analytics" element={<MOGAnalyticsPage />} />
              <Route path="/mog/people" element={<MOGPeoplePage />} />
              <Route path="/mog/people/:personUuid" element={<LinkedPersonPage />} />
              <Route path="/mog/child-tracking" element={<ChildTrackingPage />} />

              {/* ================= MOH ROUTES ================= */}
              <Route path="/moh/demand-reductions" element={<DemandReductionsPage />} />
              <Route path="/moh/demand-reductions/new" element={<DemandReductionFormPage />} />
              <Route path="/moh/demand-reductions/:id" element={<DemandReductionDetailPage />} />
              <Route path="/moh/demand-reductions/:id/edit" element={<DemandReductionFormPage />} />

              <Route path="/moh/prevention" element={<PreventionPage />} />
              <Route path="/moh/prevention/new" element={<PreventionFormPage />} />
              <Route path="/moh/prevention/:id" element={<PreventionDetailPage />} />
              <Route path="/moh/prevention/:id/edit" element={<PreventionFormPage />} />

              <Route path="/moh/facilities" element={<FacilitiesPage />} />
              <Route path="/moh/facilities/new" element={<FacilityFormPage />} />
              <Route path="/moh/facilities/:id" element={<FacilityDetailPage />} />
              <Route path="/moh/facilities/:id/edit" element={<FacilityFormPage />} />

              <Route path="/moh/referrals" element={<IncomingReferralsPage />} />
              <Route path="/moh/analytics" element={<MOHAnalyticsPage />} />

              <Route path="/moh/victims" element={<MOHBeneficiaryPage />} />
              <Route path="/moh/beneficiaries/new" element={<MOHVictimFormPage />} />
              <Route path="/moh/beneficiaries/:id" element={<VictimDetailPage />} />

              {/* ================= MOJ ROUTES ================= */}
              <Route path="/moj" element={<MOJDashboardPage />} />
              <Route path="/moj/analytics" element={<MOJAnalyticsPage />} />
              <Route path="/moj/cases" element={<MOJCasesPage />} />
              <Route path="/moj/cases/:id" element={<MOJCaseDetailPage />} />
              <Route path="/moj/hearings" element={<MOJHearingsPage />} />
              <Route path="/moj/workloads" element={<MOJWorkloadsPage />} />
              <Route path="/moj/fines" element={<MOJFinesPage />} />

              {/* ================= MOYS ROUTES ================= */}
              <Route path="/moys/analytics" element={<MOYSAnalyticsPage />} />
              
              <Route path="/moys/dashboard" element={<MOYSDashboardPage />} />
              <Route path="/moys/people" element={<MOYSBeneficiariesPage />} />
              <Route path="/moys/people/:personUuid" element={<MOYSBeneficiaryDetailPage />} />            
              

            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}