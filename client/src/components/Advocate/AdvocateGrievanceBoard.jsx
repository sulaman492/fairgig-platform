import { useEffect, useState } from 'react';
import { Filter, MessageSquareWarning, Save, Search, Sparkles } from 'lucide-react';
import { authApi } from '../../lib/authApi';

const initialFilters = {
  status: '',
  platform: '',
  search: '',
};

const statusOptions = ['pending', 'escalated', 'resolved'];

export default function AdvocateGrievanceBoard() {
  const [filters, setFilters] = useState(initialFilters);
  const [board, setBoard] = useState({ complaints: [], summary: {}, pagination: {} });
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [editState, setEditState] = useState({ status: 'pending', tags: '', cluster_id: '' });
  const [saving, setSaving] = useState(false);

  const fetchBoard = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.platform) params.set('platform', filters.platform);
      if (filters.search) params.set('search', filters.search);

      const response = await authApi.get(`/api/analytics/grievance-board?${params.toString()}`);
      setBoard(response.data);
    } catch (error) {
      console.error('Failed to load grievance board:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard();
  }, [filters.status, filters.platform, filters.search]);

  const openEditor = (complaint) => {
    setSelectedComplaint(complaint);
    setEditState({
      status: complaint.status || 'pending',
      tags: (complaint.tags || []).join(', '),
      cluster_id: String(complaint.cluster_id || complaint.suggested_cluster_id || ''),
    });
  };

  const saveComplaint = async () => {
    if (!selectedComplaint) return;

    setSaving(true);
    try {
      await authApi.put(`/api/analytics/grievance-board/${selectedComplaint.id}`, {
        status: editState.status,
        tags: editState.tags
          .split(',')
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),
        cluster_id: editState.cluster_id ? Number(editState.cluster_id) : null,
      });
      setSelectedComplaint(null);
      await fetchBoard();
    } catch (error) {
      console.error('Failed to save complaint:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Moderate Grievance Board</h2>
        <p className="mt-1 text-sm text-slate-600">
          Review worker complaints, tag them for triage, cluster similar reports, and mark cases as escalated or resolved.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Pending</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{board.summary.pending || 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Escalated</p>
          <p className="mt-2 text-2xl font-bold text-amber-700">{board.summary.escalated || 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Resolved</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{board.summary.resolved || 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Active Clusters</p>
          <p className="mt-2 text-2xl font-bold text-blue-700">{board.summary.active_clusters || 0}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_220px]">
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              placeholder="Search title, category, or description"
              className="w-full bg-transparent text-sm text-slate-900 outline-none"
            />
          </label>

          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
              className="w-full bg-transparent text-sm text-slate-900 outline-none"
            >
              <option value="">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <input
            value={filters.platform}
            onChange={(event) => setFilters((prev) => ({ ...prev, platform: event.target.value }))}
            placeholder="Filter by platform"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-gray-500">Loading grievance moderation queue...</div>
      ) : (
        <div className="space-y-4">
          {board.complaints.map((complaint) => (
            <article key={complaint.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">{complaint.platform}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{complaint.category || 'Uncategorized'}</span>
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold capitalize text-amber-700">{complaint.status}</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{complaint.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Worker: {complaint.worker_name || 'Unknown'} in {complaint.city}
                    </p>
                  </div>

                  <p className="max-w-3xl text-sm leading-6 text-slate-600">{complaint.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {(complaint.tags || []).map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="min-w-[280px] rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    Suggested Cluster
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-900">{complaint.suggested_cluster_label}</p>
                  <p className="mt-1 text-xs text-slate-500">{complaint.cluster_reason}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(complaint.suggested_tags || []).map((tag) => (
                      <span key={tag} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditor(complaint)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    <MessageSquareWarning className="h-4 w-4" />
                    Moderate
                  </button>
                </div>
              </div>
            </article>
          ))}

          {board.complaints.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
              No complaints match these filters.
            </div>
          )}
        </div>
      )}

      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900">Moderate Complaint #{selectedComplaint.id}</h3>
            <p className="mt-1 text-sm text-slate-500">{selectedComplaint.title}</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
                <select
                  value={editState.status}
                  onChange={(event) => setEditState((prev) => ({ ...prev, status: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Tags</label>
                <input
                  value={editState.tags}
                  onChange={(event) => setEditState((prev) => ({ ...prev, tags: event.target.value }))}
                  placeholder="late-payment, deduction-dispute, harassment"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Cluster ID</label>
                <input
                  value={editState.cluster_id}
                  onChange={(event) => setEditState((prev) => ({ ...prev, cluster_id: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setEditState((prev) => ({
                      ...prev,
                      cluster_id: String(selectedComplaint.suggested_cluster_id || ''),
                      tags: (selectedComplaint.suggested_tags || []).join(', '),
                    }))
                  }
                  className="mt-2 text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                  Use suggested cluster and tags
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={saveComplaint}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
