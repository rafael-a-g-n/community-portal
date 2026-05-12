import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import {
  Search,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ClipboardList,
  MapPin,
  Calendar,
  Tag,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function TrackReportPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [token, setToken] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setReport(null);
    setSearched(true);

    try {
      const data = await reportService.getReportByTrackingToken(trimmed);
      setReport(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError(t('track.notFound'));
      } else {
        setError(t('common.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        {t('common.back')}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
      >
        <div className="p-8 sm:p-12">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">{t('track.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400">{t('track.subtitle')}</p>
          </div>

          <form onSubmit={handleTrack} className="mb-8" data-testid="track-form">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={t('track.tokenPlaceholder')}
                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all text-sm font-mono dark:text-gray-100"
                data-testid="track-input"
              />
              <button
                type="submit"
                disabled={loading || !token.trim()}
                className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                data-testid="track-submit"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {t('track.trackButton')}
              </button>
            </div>
          </form>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl mb-6"
              data-testid="track-error"
            >
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
            </motion.div>
          )}

          {searched && !loading && !error && !report && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500" data-testid="track-empty">
              <p className="text-sm">{t('track.enterToken')}</p>
            </div>
          )}

          {report && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              data-testid="track-result"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{report.title}</h3>
                  <StatusBadge status={report.status} />
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{report.description}</p>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Tag className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span>
                      {typeof report.category === 'object'
                        ? i18n.language === 'pt' && report.category.name_pt
                          ? report.category.name_pt
                          : report.category.name
                        : report.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span>{new Date(report.created_at).toLocaleDateString(i18n.language)}</span>
                  </div>
                  {report.resolution_comment && (
                    <div className="col-span-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-xs font-bold text-green-700 mb-1">
                        {t('form.resolutionComment')}
                      </p>
                      <p className="text-sm text-green-800">{report.resolution_comment}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => navigate(`/reports/${report.id}`)}
                  className="w-full mt-2 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all"
                >
                  {t('home.viewDetail')}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
