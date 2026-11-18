import { useAuth } from "../contexts/AuthContext";
import AccountForm from "../components/account/AccountForm";
import ProfileForm from "../components/account/ProfileForm";
import PasswordForm from "../components/account/PasswordForm";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Account settings
        </h1>
        <p className="mt-1 text-sm text-base-content/60">
          Manage your profile, sign-in credentials, and preferences.
        </p>
      </header>

      <Section title="Account" subtitle="Your name and email on record.">
        <AccountForm user={user} />
      </Section>

      <Section title="Profile" subtitle="Additional details shared with your institution.">
        <ProfileForm user={user} />
      </Section>

      <Section
        title="Password"
        subtitle="Use a strong password you don't reuse elsewhere."
      >
        <PasswordForm />
      </Section>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <section className="rounded-[--radius-box] border border-base-300 bg-base-100 p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-xs text-base-content/60">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}