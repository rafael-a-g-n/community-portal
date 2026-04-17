import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { logout, isAuthenticated } from '../services/authService';
import {
  LogOut,
  RefreshCw,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  X,
  Save,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const STATUS_CONFIG = {
  open: {
    label: 'Open',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  resolved: {
    label: 'Resolved',
    className: 'bg-green-100 text-green-700 border-green-200',
  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function EditDrawer({ report, categories, onClose, onSaved, onDeleted }) {
  const [title, setTitle] = useState(report.title);
  const [description, setDescription] = useState(report.description);
  const [category, setCategory] = useState(
    typeof report.category === 'object' ? report.category.id : report.category
  );
  const [status, setStatus] = useState(report.status);
  const [comment, setComment] = useState(report.resolution_comment ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await reportService.updateReport(report.id, {
        title,
        description,
        category,
        status,
        resolution_comment: comment,
      });
      onSaved(updated);
      onClose();
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you certain you want to delete this report? This is permanent.')) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await reportService.deleteReport(report.id);
      onDeleted(report.id);
      onClose();
    } catch {
      setError('Failed to delete report.');
      setDeleting(false);
    }
  };


  return (
    <motion.div
      key="drawer-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-40 flex justify-end"
      onClick={onClose}
    >
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        data-testid="edit-drawer"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Edit Report</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{report.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {error && (
            <div
              data-testid="drawer-error"
              className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Title input */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          {/* Description input */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          {/* Category Select */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
            <div className="relative">
              <select
                value={category || ''}
                onChange={(e) => setCategory(Number(e.target.value))}
                className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none cursor-pointer"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Status Selector */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Status</label>
            <div className="space-y-2">
              {['open', 'in_progress', 'resolved'].map((s) => {
                const cfg = STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${
                      status === s
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    {cfg.label}
                    {status === s && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resolution Comment */}
          <div>
            <label htmlFor="resolution-comment" className="block text-sm font-bold text-gray-700 mb-2">
              Resolution Comment
              <span className="ml-1 font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              id="resolution-comment"
              rows={5}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe the action taken or resolution details…"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50"
            />
            <p className="text-xs text-gray-400 mt-1">
              This comment will be publicly visible on the report page.
            </p>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button
            onClick={handleDelete}
            disabled={saving || deleting}
            className="flex items-center justify-center px-4 py-3 bg-red-100 text-red-700 font-bold rounded-xl hover:bg-red-200 disabled:opacity-50 transition-all border border-red-200"
            title="Delete Report"
            data-testid="delete-btn"
          >
            {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving || deleting}
            data-testid="save-btn"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-100"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </button>
        </div>
      </motion.aside>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const PAGE_SIZE = 10;

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/admin');
    }
  }, [navigate]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page };
      if (statusFilter) params.status = statusFilter;
      const [reportsData, catsData] = await Promise.all([
        reportService.getReports(params),
        reportService.getCategories()
      ]);
      setReports(reportsData.results ?? []);
      setTotalCount(reportsData.count ?? 0);
      setCategories(catsData ?? []);
    } catch {
      setError('Failed to load reports. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  const handleReportSaved = (updated) => {
    setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleReportDeleted = (deletedId) => {
    setReports((prev) => prev.filter((r) => r.id !== deletedId));
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-dashboard">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-gray-900 text-lg">Admin Dashboard</span>
              <span className="ml-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                {totalCount} Reports
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchReports}
              title="Refresh"
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="pl-4 pr-10 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-2xl px-5 py-4 text-sm mb-6" role="alert">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-24" data-testid="dashboard-loader">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-24 text-gray-400" data-testid="no-reports">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No reports found</p>
            </div>
          ) : (
            <table className="w-full text-sm" data-testid="reports-table">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900 truncate max-w-xs">{report.title}</p>
                      {report.resolution_comment && (
                        <p className="text-xs text-green-600 mt-0.5 truncate max-w-xs">
                          ✓ Comment added
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {typeof report.category === 'object' ? report.category?.name : report.category}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="px-5 py-4 text-gray-400">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedReport(report)}
                        data-testid={`edit-btn-${report.id}`}
                        className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-100"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </main>

      {/* Slide-in Edit Drawer */}
      <AnimatePresence>
        {selectedReport && (
          <EditDrawer
            report={selectedReport}
            categories={categories}
            onClose={() => setSelectedReport(null)}
            onSaved={handleReportSaved}
            onDeleted={handleReportDeleted}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
