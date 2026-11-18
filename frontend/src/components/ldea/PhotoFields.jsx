export default function PhotoField({
  label,
  name,
  currentUrl,
  error,
  onChange,
}) {
  function handleChange(event) {
    const file = event.target.files?.[0] ?? null;

// Pass the actual File object to the parent
    onChange(file);
  }

return (
    <div className="form-control w-full">
      <label className="label" htmlFor={name}>
        <span className="label-text">{label}</span>
      </label>

<input
        id={name}
        name={name}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="file-input file-input-bordered w-full"
      />

{currentUrl && (
        <img
          src={currentUrl}
          alt="Current portrait"
          className="mt-3 h-32 w-32 rounded-lg object-cover"
        />
      )}

{error && (
        <p className="mt-1 text-sm text-error">
          {Array.isArray(error) ? error.join(", ") : error}
        </p>
      )}
    </div>
  );
}
