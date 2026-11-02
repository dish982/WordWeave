// Controlled component: the parent owns the value, this just displays it
export default function ToggleSwitch({ checked, onChange }) {
  return (
    <div className="inline-flex items-center gap-2 py-1">
      <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Private</span>
      <label className="relative inline-block w-11 h-5 cursor-pointer">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="absolute inset-0 rounded-full bg-slate-200 transition-colors duration-300 peer-checked:bg-maroon peer-focus-visible:ring-2 peer-focus-visible:ring-maroon/40" />
        <span className="absolute top-0 left-0 w-5 h-5 bg-white rounded-full border border-slate-300 shadow-sm transition-transform duration-300 peer-checked:translate-x-6 peer-checked:border-maroon" />
      </label>
      <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Public</span>
    </div>
  );
}