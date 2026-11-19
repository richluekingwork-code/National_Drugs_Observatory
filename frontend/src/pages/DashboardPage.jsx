// frontend/src/pages/DashboardPage.jsx
import { lazy, Suspense, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./../contexts/AuthContext";
import { useRoles } from "./../hooks/useRoles";
import { PageSpinner } from "./ldea/Seizures/SeizureDetailPage";

const LdeaAnalyticsPage = lazy(() => import("./ldea/analytics/AnalyticsPage"));
const MogAnalyticsPage = lazy(() => import("./mog/analytics/AnalyticsPage"));
const MohAnalyticsPage = lazy(() => import("./moh/analytics/AnalyticsPage"));
const MojDashboardPage = lazy(() => import("./moj/MOJDashboardPage"));

// This tells the router to load your MOYS Dashboard
const MOYSDashboardPage = lazy(() => import("./moys/Dashboard/MOYSDashboardPage"));

const ANALYTICS = [
  { key: "LDEA", label: "LDEA", Component: LdeaAnalyticsPage, match: /\bLDEA\b|DRUG ENFORCEMENT/ },
  { key: "MOG",  label: "MOG",  Component: MogAnalyticsPage,  match: /\bMOG\b|GENDER/ },
  { key: "MOH",  label: "MOH",  Component: MohAnalyticsPage,  match: /\bMOH\b|HEALTH/ },
  { key: "MOJ",  label: "MOJ",  Component: MojDashboardPage,  match: /\bMOJ\b|JUSTICE/ },
  { key: "MOYS", label: "MOYS", Component: MOYSDashboardPage, match: /\bMOYS\b|YOUTH/ },
];

function resolveEntry(membership) {
  const inst = membership?.institution;
  if (!inst) return null;
  const text = `${inst.code ?? ""} ${inst.name ?? ""}`.toUpperCase();
  return ANALYTICS.find((a) => a.match.test(text)) ?? null;
}

export default function DashboardPage() {
  const { user, status, memberships, currentMembership, switchInstitution } = useAuth();
  const { isSuperuser } = useRoles();

  const available = useMemo(
    () =>
      memberships
        .map((m) => ({ m, entry: resolveEntry(m) }))
        .filter((x) => x.entry),
    [memberships],
  );

  if (status === "loading") return <PageSpinner />;
  if (isSuperuser && memberships.length === 0) return <Navigate to="/superadmin" replace />;

  const active =
    available.find((x) => x.m.institution?.id === currentMembership?.institution?.id) ??
    available[0];

  if (!active) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-base-300 bg-base-100 p-8 text-center">
        <h1 className="text-lg font-semibold">No dashboard available</h1>
        <p className="mt-1 text-sm text-base-content/60">
          Your account isn't linked to an institution with an analytics page.
        </p>
      </div>
    );
  }

  const { Component } = active.entry;
  const activeId = active.m.institution.id;

  return (
    <div className="space-y-4">
      {available.length > 1 && (
        <div role="tablist" className="tabs tabs-box w-fit">
          {available.map(({ m, entry }) => {
            const isActive = m.institution.id === activeId;
            return (
              <button
                key={m.institution.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => switchInstitution(m.institution.id)}
                className={"tab " + (isActive ? "tab-active" : "")}
              >
                {entry.label}
              </button>
            );
          })}
        </div>
      )}

      <Suspense fallback={<PageSpinner />}>
        <Component key={`${user?.id}-${activeId}`} />
      </Suspense>
    </div>
  );
}