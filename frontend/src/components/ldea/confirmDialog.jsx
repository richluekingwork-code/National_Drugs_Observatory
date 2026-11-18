import { useEffect, useId, useRef } from "react";
import { AlertTriangle, HelpCircle, Loader2 } from "lucide-react";

const TONES = {
  danger: {
    icon: AlertTriangle,
    iconWrap: "bg-error/10 text-error",
    button: "btn-error",
  },
  primary: {
    icon: HelpCircle,
    iconWrap: "bg-primary/10 text-primary",
    button: "btn-primary",
  },
};

/**
 * Modal confirmation built on the native <dialog> element, so focus trapping,
 * Escape handling and the backdrop come from the browser.
 *
 * @param {object}   props
 * @param {string}   props.title
 * @param {node}     props.body
 * @param {string}   props.confirmLabel  - say what will happen, e.g. "Delete"
 * @param {string}   props.cancelLabel
 * @param {string}   props.tone          - "danger" (default) | "primary"
 * @param {boolean}  props.submitting    - locks the dialog while the request runs
 * @param {function} props.onConfirm
 * @param {function} props.onCancel
 */
export function ConfirmDialog({
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  submitting = false,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const bodyId = useId();
  const { icon: Icon, iconWrap, button } = TONES[tone] ?? TONES.danger;

  // Open as a modal on mount, close on unmount.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  // Escape: let the parent decide, and block it while a request is running.
  function handleCancelEvent(e) {
    e.preventDefault();
    if (!submitting) onCancel?.();
  }

  // Click on the backdrop (the dialog element itself, outside the panel).
  function handleBackdropClick(e) {
    if (e.target === dialogRef.current && !submitting) onCancel?.();
  }

  return (
    <dialog
      ref={dialogRef}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={body ? bodyId : undefined}
      onCancel={handleCancelEvent}
      onClick={handleBackdropClick}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-base-300 bg-base-100 p-0 text-base-content shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-[2px]"
    >
      <div className="flex gap-4 p-6">
        <span className={`grid size-10 shrink-0 place-items-center rounded-full ${iconWrap}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id={titleId} className="text-base font-semibold tracking-tight">
            {title}
          </h2>
          {body && (
            <p id={bodyId} className="mt-1.5 text-sm text-base-content/70">
              {body}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-base-300 bg-base-200/30 px-6 py-3">
        {/* Cancel is focused first so Enter never confirms a destructive action by accident */}
        <button
          type="button"
          autoFocus
          className="btn btn-outline btn-sm h-9 rounded-lg"
          onClick={onCancel}
          disabled={submitting}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`btn btn-sm h-9 rounded-lg px-4 ${button}`}
          onClick={onConfirm}
          disabled={submitting}
        >
          {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

export default ConfirmDialog;