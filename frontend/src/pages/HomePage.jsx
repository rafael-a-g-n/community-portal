import { useEffect, useState, useCallback } from 'react';
import { reportService } from '../services/reportService';
import ReportCard from '../components/ReportCard';
import { Filter, Search, Loader2, AlertCircle, ClipboardList, ChevronDown, Map, List, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useTranslation } from 'react-i18next';

const PAGE_SIZE = 12;

export default function HomePage() {
  const { localizedSettings } = useSiteSettings();
  const { t, i18n } = useTranslation();
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState(undefined);
  const [selectedStatus, setSelectedStatus] = useState(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [mapView, setMapView] = useState(false);

  const filtersChanged = selectedCategory || selectedStatus || debouncedSearch;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    setReports([]);
  }, [selectedCategory, selectedStatus, debouncedSearch]);

  const fetchPage = useCallback(async (pageNum, append = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const params = {
        category: selectedCategory,
        status: selectedStatus,
        search: debouncedSearch,
        page: pageNum,
        page_size: PAGE_SIZE,
      };

      const reportsData = await reportService.getReports(params);
      const results = reportsData.results;

      if (append) {
        setReports((prev) => [...prev, ...results]);
      } else {
        setReports(results);
      }

      setTotalCount(reportsData.count);
    } catch (err) {
      setError(t('common.error'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, selectedStatus, debouncedSearch, t]);

  useEffect(() => {
    fetchPage(1, false);
  }, [fetchPage]);

  // Fetch categories once
  useEffect(() => {
    reportService.getCategories().then(setCategories).catch(() => {});
  }, []);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasMore = page < totalPages;

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchPage(nextPage, true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 sm:text-5xl tracking-tight mb-4"
        >
          {localizedSettings?.hero_title}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto whitespace-pre-wrap"
        >
          {localizedSettings?.hero_subtitle}
        </motion.p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300">
            <Filter className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
            {t('admin.reportsTab')}:
          </div>
          
          <select 
            value={selectedCategory || ''} 
            onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors text-gray-900 dark:text-gray-100"
          >
            <option value="">{t('category.all')}</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {i18n.language === 'pt' && cat.name_pt ? cat.name_pt : cat.name}
              </option>
            ))}
          </select>

          <select 
            value={selectedStatus || ''} 
            onChange={(e) => setSelectedStatus(e.target.value || undefined)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors text-gray-900 dark:text-gray-100"
          >
            <option value="">{t('status.all')}</option>
            <option value="open">{t('status.open')}</option>
            <option value="in_progress">{t('status.in_progress')}</option>
            <option value="resolved">{t('status.resolved')}</option>
          </select>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input 
            type="text" 
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64 dark:text-gray-100"
          />
        </div>

        <button
          onClick={() => setMapView(!mapView)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors"
        >
          {mapView ? <List className="w-4 h-4" /> : <Map className="w-4 h-4" />}
          {mapView ? t('home.listView') : t('home.mapView')}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20" data-testid="loading-spinner">
          <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">{t('common.loading')}</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl p-8 text-center" data-testid="error-message">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-900 dark:text-red-200 mb-2">{t('common.error')}</h3>
          <p className="text-red-700 dark:text-red-300 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors"
          >
            {t('common.refresh')}
          </button>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700" data-testid="empty-state">
          <ClipboardList className="w-16 h-16 text-gray-300 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{localizedSettings?.empty_state_title}</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 whitespace-pre-wrap">{localizedSettings?.empty_state_body}</p>
          <button 
            onClick={() => window.location.href = '/create'}
            className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition-all"
          >
            {localizedSettings?.hero_cta_text}
          </button>
        </div>
      ) : mapView ? (
        <div className="space-y-4" data-testid="map-view">
          <AnimatePresence>
            {reports.map((report) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex-shrink-0">
                    <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <a
                      href={`/reports/${report.id}`}
                      className="text-lg font-bold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      {report.title}
                    </a>
                    {report.latitude && report.longitude ? (
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        {report.address || `${report.latitude}, ${report.longitude}`}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('home.noLocation')}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="reports-grid">
            <AnimatePresence mode="popLayout">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </AnimatePresence>
          </div>

          {hasMore && (
            <div className="flex justify-center mt-10">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-8 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
              >
                {loadingMore ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                {loadingMore ? t('common.loading') : t('home.loadMore')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
