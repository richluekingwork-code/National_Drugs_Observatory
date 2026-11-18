// frontend/src/components/mog/FormModal.jsx
import { X } from "lucide-react";

export default function FormModal({ title, isOpen, onClose, busy = false, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onMouseDown={busy ? undefined : onClose}>
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-base-300 bg-base-200/40 px-4 py-3">
          <h2 className="text-base font-semibold">{title}</h2>
          <button type="button" onClick={onClose} disabled={busy} className="rounded-md p-1 text-base-content/60 hover:bg-base-200 hover:text-base-content disabled:opacity-40" aria-label="Close">
            <X className="size-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
