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
  Plus,
  LayoutDashboard,
  Tag,
  Settings,
  Search,
  BarChart,
  Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { updateSettings } from '../services/settingsService';
import { useTranslation } from 'react-i18next';

import StatusBadge from '../components/StatusBadge';

import EditDrawer from '../components/admin/EditDrawer';
import SiteSettingsManager from '../components/admin/SiteSettingsManager';
import CategoryManager from '../components/admin/CategoryManager';
import AnalyticsTab from '../components/admin/AnalyticsTab';



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
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'analytics' | 'categories' | 'settings'
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const PAGE_SIZE = 10;
  const { t, i18n } = useTranslation();


  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/admin');
    }
  }, [navigate]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page };
      if (statusFilter) params.status = statusFilter;
      if (debouncedSearch) params.search = debouncedSearch;
      
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
  }, [statusFilter, page, debouncedSearch]);

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

  const handleCategorySaved = (cat) => {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === cat.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = cat;
        return next;
      }
      return [...prev, cat];
    });
  };

  const handleCategoryDeleted = (id) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800" data-testid="admin-dashboard">
      {/* Top Bar */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-gray-900 dark:text-gray-100 text-lg">{t('admin.dashboard')}</span>
              <span className="ml-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/30">
                {totalCount} {t('admin.reportsTab')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchReports}
              title="Refresh"
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </header>

      {/* Sub-header Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex gap-6">
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'reports'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            {t('admin.reportsTab')}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'analytics'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <BarChart className="w-4 h-4" />
            {t('admin.analyticsTab')}
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'categories'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <Tag className="w-4 h-4" />
            {t('admin.categoriesTab')}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'settings'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <Settings className="w-4 h-4" />
            {t('admin.settingsTab')}
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'reports' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="pl-4 pr-10 py-2.5 text-sm font-semibold border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                  aria-label={t('status.all')}
                >
                  <option value="">{t('status.all')}</option>
                  <option value="open">{t('status.open')}</option>
                  <option value="in_progress">{t('status.in_progress')}</option>
                  <option value="resolved">{t('status.resolved')}</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
              </div>

              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder={t('common.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Export CSV */}
            <div className="flex justify-end mb-4">
              <a
                href={`${import.meta.env.VITE_API_URL || '/api/v1'}/admin/reports/export/`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl border border-indigo-100 dark:border-indigo-900/30 transition-colors"
              >
                <Download className="w-4 h-4" />
                {t('admin.exportCSV')}
              </a>
            </div>

            {/* Table */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-2xl px-5 py-4 text-sm mb-6" role="alert">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              {loading ? (
                <div className="flex justify-center items-center py-24" data-testid="dashboard-loader">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-24 text-gray-400 dark:text-gray-500" data-testid="no-reports">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">{t('admin.noReports')}</p>
                </div>
              ) : (
                <table className="w-full text-sm" data-testid="reports-table">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin.table.title')}</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin.table.category')}</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin.table.status')}</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin.table.date')}</th>
                      <th className="px-5 py-3.5 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin.table.action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-xs">{report.title}</p>
                          {report.resolution_comment && (
                            <p className="text-xs text-green-600 mt-0.5 truncate max-w-xs">
                              ✓ Comment added
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                          {typeof report.category === 'object' 
                            ? (i18n.language === 'pt' && report.category.name_pt ? report.category.name_pt : report.category.name)
                            : report.category}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={report.status} />
                        </td>
                        <td className="px-5 py-4 text-gray-400 dark:text-gray-500">
                          {new Date(report.created_at).toLocaleDateString(i18n.language)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setSelectedReport(report)}
                            data-testid={`edit-btn-${report.id}`}
                            className="px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors border border-indigo-100 dark:border-indigo-900/30"
                          >
                            {t('common.manage')}
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
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Analytics Tab Contents */}
        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <AnalyticsTab />
          </motion.div>
        )}

        {/* Category Manager Tab Contents */}
        {activeTab === 'categories' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <CategoryManager 
              categories={categories} 
              onSaved={handleCategorySaved} 
              onDeleted={handleCategoryDeleted} 
            />
          </motion.div>
        )}

        {/* Site Settings Tab Contents */}
        {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <SiteSettingsManager />
          </motion.div>
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
