import { useEffect, useState } from 'react';
import * as api from './api';
import { PRIORITIES, STATUSES } from './constants';
import TaskCard from './components/TaskCard';
import TaskForm from './components/TaskForm';
import Spinner from './components/Spinner';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [editing, setEditing] = useState(undefined); // undefined = modal closed, null = new task, object = editing

  async function load() {
    setLoading(true);
    setError('');
    try {
      setTasks(await api.getTasks());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(data) {
    if (editing) {
      const updated = await api.updateTask(editing.id, data);
      setTasks((ts) => ts.map((t) => (t.id === updated.id ? updated : t)));
    } else {
      const created = await api.createTask(data);
      setTasks((ts) => [created, ...ts]);
    }
    setEditing(undefined);
  }

  async function handleDelete(task) {
    if (!confirm(`Delete "${task.title}"?`)) return;
    try {
      await api.deleteTask(task.id);
      setTasks((ts) => ts.filter((t) => t.id !== task.id));
    } catch (err) {
      setError(err.message);
    }
  }

  const visible = tasks.filter(
    (t) => (!statusFilter || t.status === statusFilter) && (!priorityFilter || t.priority === priorityFilter)
  );
  const stats = [['Total', tasks.length], ...STATUSES.map((s) => [s, tasks.filter((t) => t.status === s).length])];
  const select =
    'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white">T</div>
            <span className="text-lg font-semibold text-slate-900">Taskly</span>
          </div>
          <button
            onClick={() => setEditing(null)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            + New task
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map(([label, count]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{count}</p>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <h1 className="text-xl font-semibold text-slate-900 sm:mr-auto">Tasks</h1>
          <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={select}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select aria-label="Filter by priority" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className={select}>
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </section>

        {error && (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <span>{error}</span>
            <button onClick={load} className="font-medium underline">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20 text-indigo-600">
            <Spinner className="h-8 w-8" />
          </div>
        ) : visible.length === 0 && !error ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <p className="font-medium text-slate-900">{tasks.length ? 'No tasks match these filters' : 'No tasks yet'}</p>
            <p className="mt-1 text-sm text-slate-500">
              {tasks.length ? 'Try changing the filters above.' : 'Create your first task to get started.'}
            </p>
          </div>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((t) => (
              <TaskCard key={t.id} task={t} onEdit={setEditing} onDelete={handleDelete} />
            ))}
          </section>
        )}
      </main>

      {editing !== undefined && <TaskForm task={editing} onSave={handleSave} onClose={() => setEditing(undefined)} />}
    </div>
  );
}
