import { forwardRef, useState, useId } from "react";
import { Eye, EyeOff } from "lucide-react";

const PasswordField = forwardRef(function PasswordField(
  { label, error, autoComplete = "current-password", name = "password", ...rest },
  ref
) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="form-control w-full">
      <label htmlFor={id} className="label pb-1.5">
        <span className="label-text text-sm font-medium text-base-content/80">
          {label}
        </span>
      </label>

      <div className="relative">
        <input
          id={id}
          ref={ref}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? errorId : undefined}
          className={[
            "input input-bordered w-full h-11 pr-11 text-base",
            "transition-colors focus:outline-none",
            error ? "input-error" : "",
          ].join(" ")}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          tabIndex={0}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-[--radius-field] text-base-content/60 hover:text-base-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
        >
          {visible ? (
            <EyeOff className="size-4.5" aria-hidden="true" />
          ) : (
            <Eye className="size-4.5" aria-hidden="true" />
          )}
        </button>
      </div>

      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
});

export default PasswordField;