
export default function ThemeTest() {
  return (
    <main className="min-h-screen space-y-6 bg-base-100 p-8 text-base-content">
      <section className="rounded-box border border-base-300 bg-base-200 p-6">
        <h1 className="text-2xl font-bold text-primary">
          National Drug Observatory
        </h1>
        <p className="mt-2">
          If the theme is working, this surface should use the configured
          base colors, with midnight blue primary text.
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <button className="btn btn-primary">Primary</button>
        <button className="btn btn-secondary">Secondary</button>
        <button className="btn btn-accent">Accent</button>
        <button className="btn btn-outline">Outline</button>
      </div>

      <div className="rounded-box border border-base-300 bg-base-100 p-5">
        <p className="text-base-content">Base content</p>
        <p className="text-secondary">Jade secondary</p>
        <p className="text-success">Success status</p>
        <p className="text-warning">Warning status</p>
        <p className="text-error">Error status</p>
      </div>
    </main>
  );
}
