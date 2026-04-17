import { useEffect, useState } from 'react';
import { reportService } from '../services/reportService';
import ReportCard from '../components/ReportCard';
import { Filter, Search, Loader2, AlertCircle, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useTranslation } from 'react-i18next';

export default function HomePage() {
  const { localizedSettings } = useSiteSettings();
  const { t, i18n } = useTranslation();
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedCategory, setSelectedCategory] = useState(undefined);
  const [selectedStatus, setSelectedStatus] = useState(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [reportsData, categoriesData] = await Promise.all([
          reportService.getReports({ 
            category: selectedCategory, 
            status: selectedStatus,
            search: debouncedSearch 
          }),
          reportService.getCategories(),
        ]);
        setReports(reportsData.results);
        setCategories(categoriesData);
      } catch (err) {
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedCategory, selectedStatus, debouncedSearch, t]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-extrabold text-gray-900 sm:text-5xl tracking-tight mb-4"
        >
          {localizedSettings?.hero_title}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-gray-600 max-w-2xl mx-auto whitespace-pre-wrap"
        >
          {localizedSettings?.hero_subtitle}
        </motion.p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center px-3 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700">
            <Filter className="w-4 h-4 mr-2 text-gray-400" />
            {t('admin.reportsTab')}:
          </div>
          
          <select 
            value={selectedCategory || ''} 
            onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:border-indigo-300 transition-colors"
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
            className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:border-indigo-300 transition-colors"
          >
            <option value="">{t('status.all')}</option>
            <option value="open">{t('status.open')}</option>
            <option value="in_progress">{t('status.in_progress')}</option>
            <option value="resolved">{t('status.resolved')}</option>
          </select>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20" data-testid="loading-spinner">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">{t('common.loading')}</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center" data-testid="error-message">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-900 mb-2">{t('common.error')}</h3>
          <p className="text-red-700 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors"
          >
            {t('common.refresh')}
          </button>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200" data-testid="empty-state">
          <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">{localizedSettings?.empty_state_title}</h3>
          <p className="text-gray-500 mb-8 whitespace-pre-wrap">{localizedSettings?.empty_state_body}</p>
          <button 
            onClick={() => window.location.href = '/create'}
            className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
          >
            {localizedSettings?.hero_cta_text}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="reports-grid">
          <AnimatePresence mode="popLayout">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
