import { PRIORITY_STYLES, STATUS_STYLES } from '../constants';

export default function TaskCard({ task, onEdit, onDelete }) {
  const done = task.status === 'Completed';
  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[task.status]}`}>
          {task.status}
        </span>
        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}>
          {task.priority}
        </span>
      </div>

      <h3 className={`break-words font-semibold ${done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
        {task.title}
      </h3>
      {task.description && (
        <p className="mt-1.5 whitespace-pre-line break-words text-sm text-slate-600">{task.description}</p>
      )}

      <div className="mt-auto flex items-center justify-between pt-4 text-xs text-slate-400">
        <time dateTime={task.created_at}>{new Date(task.created_at).toLocaleDateString()}</time>
        <div className="flex gap-1">
          <button onClick={() => onEdit(task)} className="rounded-md px-2.5 py-1.5 font-medium text-slate-600 hover:bg-slate-100">
            Edit
          </button>
          <button onClick={() => onDelete(task)} className="rounded-md px-2.5 py-1.5 font-medium text-rose-600 hover:bg-rose-50">
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
