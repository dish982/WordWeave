export default function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', onConfirm, onCancel, busy }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-500/75" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <p className="mt-2 text-sm text-gray-500">{message}</p>
        </div>
        <div className="bg-gray-50 px-6 py-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button onClick={onCancel} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 border border-gray-300 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={busy} className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60">
            {busy ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}