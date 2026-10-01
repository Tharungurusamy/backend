import { useState } from 'react';
import { PRIORITIES, STATUSES } from '../constants';
import Spinner from './Spinner';

const EMPTY = { title: '', description: '', priority: 'Medium', status: 'Pending' };

// Modal used for both creating (task = null) and editing a task.
export default function TaskForm({ task, onSave, onClose }) {
  const [form, setForm] = useState(task ? { ...EMPTY, ...task } : EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return setError('Title is required.');
    setSaving(true);
    setError('');
    try {
      const { title, description, priority, status } = form;
      await onSave({ title, description, priority, status });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const input =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';

  return (
    <div className="fixed inset-0 z-10 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center" onMouseDown={onClose}>
      <form
        onSubmit={handleSubmit}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold text-slate-900">{task ? 'Edit task' : 'New task'}</h2>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Title *</span>
          <input autoFocus maxLength={200} value={form.title} onChange={set('title')} className={input} />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Description</span>
          <textarea rows={3} maxLength={2000} value={form.description} onChange={set('description')} className={input} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Priority</span>
            <select value={form.priority} onChange={set('priority')} className={input}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <select value={form.status} onChange={set('status')} className={input}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving && <Spinner className="h-4 w-4" />}
            {task ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </div>
  );
}
