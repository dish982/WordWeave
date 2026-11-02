import { useState } from 'react';
import ToggleSwitch from './ToggleSwitch';

const EMPTY = { title: '', content: '', isPublic: true };
const input =
  'w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-maroon/20 focus:border-maroon focus:bg-white transition-all duration-200';

export default function PostForm({ initial = EMPTY, onSubmit, submitLabel, resetOnSuccess = false, rows = 6, children }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit(form);
      if (resetOnSuccess) setForm(EMPTY);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold">{error}</div>
      )}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Post Title</label>
        <input value={form.title} onChange={set('title')} placeholder="Enter a descriptive title." required maxLength={150} className={input} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Story Content</label>
        <textarea value={form.content} onChange={set('content')} rows={rows} placeholder="Write your thoughts down here." required className={`${input} resize-none`} />
      </div>
      <ToggleSwitch checked={form.isPublic} onChange={(v) => setForm({ ...form, isPublic: v })} />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="flex-1 py-3 bg-maroon text-white font-bold rounded-xl hover:bg-maroon-hover active:scale-[0.99] transition-all text-sm shadow-md shadow-maroon/10 disabled:opacity-60">
          {saving ? 'Saving…' : submitLabel}
        </button>
        {children}
      </div>
    </form>
  );
}