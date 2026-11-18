// src/components/admin/ConfirmDialog.jsx
import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { Loader2, UserX, UserCheck } from "lucide-react";

export default function ConfirmDialog({
  title,
  children,
  confirmLabel = "Confirm",
  tone = "error", // "error" | "success"
  busy = false,
  error = "",
  onConfirm,
  onClose,
}) {
  const titleId = useId();
  const Icon = tone === "success" ? UserCheck : UserX;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-box border border-base-300 bg-base-100 p-5 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <div
            className={`grid size-10 shrink-0 place-items-center rounded-full ${
              tone === "success" ? "bg-success/10 text-success" : "bg-error/10 text-error"
            }`}
          >
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-base-content">
              {title}
            </h2>
            <div className="mt-1 break-words text-sm text-base-content/70">{children}</div>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-field border border-error/30 bg-error/5 px-3.5 py-2.5 text-sm text-error"
          >
            {error}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="btn btn-ghost btn-sm normal-case"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`btn btn-sm min-w-28 normal-case ${
              tone === "success" ? "btn-success" : "btn-error"
            }`}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}