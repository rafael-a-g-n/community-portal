import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/reportService';
import { Loader2, AlertCircle } from 'lucide-react';

const STATUS_COLORS = {
  open: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300', label: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-400' },
  in_progress: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300', label: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-400' },
  resolved: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300', label: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-400' },
};

export default function AnalyticsTab() {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/admin/stats/');
        if (!cancelled) setStats(res.data);
      } catch {
        if (!cancelled) setError('Failed to load analytics.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-2xl px-5 py-4 text-sm" role="alert">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        {error}
      </div>
    );
  }

  if (!stats) return null;

  const totalByStatus = stats.by_status || {};
  const totalReports = stats.total_reports || 0;
  const maxCategoryCount = Math.max(...(stats.by_category || []).map(c => c.count), 1);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin.analytics.totalReports')}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{totalReports}</p>
        </div>
        {['open', 'in_progress', 'resolved'].map((status) => {
          const colors = STATUS_COLORS[status];
          const count = totalByStatus[status] || 0;
          return (
            <div key={status} className={`${colors.bg} rounded-2xl border ${colors.border} shadow-sm p-5`}>
              <p className={`text-xs font-semibold ${colors.label} uppercase tracking-wider`}>{t(`status.${status}`)}</p>
              <p className={`text-3xl font-bold ${colors.text} mt-1`}>{count}</p>
            </div>
          );
        })}
      </div>

      {/* Reports by Category */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">{t('admin.analytics.byCategory')}</h3>
        {stats.by_category && stats.by_category.length > 0 ? (
          <div className="space-y-3">
            {stats.by_category.map((cat) => {
              const label = i18n.language === 'pt' && cat.category__name_pt ? cat.category__name_pt : cat.category__name;
              const pct = Math.round((cat.count / maxCategoryCount) * 100);
              return (
                <div key={cat.category__name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
                    <span className="text-gray-500 dark:text-gray-400">{cat.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">{t('admin.analytics.noData')}</p>
        )}
      </div>
    </div>
  );
}
