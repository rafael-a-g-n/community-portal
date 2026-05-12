import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { reportService } from '../services/reportService';
import { Camera, Upload, AlertCircle, Loader2, ArrowLeft, CheckCircle2, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

export default function CreateReportPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [submittedToken, setSubmittedToken] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    latitude: '',
    longitude: '',
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await reportService.getCategories();
        setCategories(data);
      } catch (err) {
        setError(t('createReport.submitError'));
      } finally {
        setFetchingCategories(false);
      }
    }
    loadCategories();
  }, [t]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.category) {
      setError(t('createReport.fieldRequired'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category_id', formData.category);
      if (image) data.append('photo', image);
      if (formData.latitude) data.append('latitude', formData.latitude);
      if (formData.longitude) data.append('longitude', formData.longitude);

      const result = await reportService.createReport(data);
      setSubmittedToken(result.tracking_token);
      setSuccess(true);
      setTimeout(() => navigate('/'), 5000);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const payload = err.response.data;
        if (typeof payload === 'object' && payload !== null) {
          const message = Object.values(payload)
            .flat()
            .map((value) => String(value))
            .join(' ')
            .trim();
          if (message) {
            setError(message);
            return;
          }
        }
      }
      setError(t('createReport.submitError'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('createReport.successTitle')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{t('createReport.successBody')}</p>

          {submittedToken && (
            <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-5 mb-6 text-left">
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
                {t('track.title')}
              </p>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl p-3 border border-indigo-100 dark:border-indigo-800 mb-3">
                <code className="text-sm font-mono text-indigo-800 dark:text-indigo-200 break-all flex-1">
                  {submittedToken}
                </code>
              </div>
              <Link
                to={`/track`}
                className="inline-flex items-center gap-2 text-sm font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                {t('track.trackButton')}
              </Link>
            </div>
          )}

          <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 5 }}
              className="bg-emerald-500 h-full"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        {t('common.back')}
      </button>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-indigo-50/50 border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-8 sm:p-12">
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">{t('createReport.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400">{t('createReport.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8" data-testid="create-report-form">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-start space-x-3" data-testid="error-message">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-8">
              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  {t('createReport.issueTitleLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t('createReport.issueTitlePlaceholder')}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all dark:text-gray-100"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  {t('createReport.categoryLabel')} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {fetchingCategories ? (
                    <div className="col-span-full py-4 text-center text-gray-400 dark:text-gray-500 text-sm">{t('common.loading')}</div>
                  ) : (
                    categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: String(cat.id) })}
                        className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
                          formData.category === String(cat.id)
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20'
                        }`}
                      >
                        {i18n.language === 'pt' && cat.name_pt ? cat.name_pt : cat.name}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  {t('createReport.descriptionLabel')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('createReport.descriptionPlaceholder')}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all resize-none dark:text-gray-100"
                />
              </div>

              {/* Latitude */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  {t('form.latitude')} <span className="text-gray-400 dark:text-gray-500 font-normal lowercase">({t('common.optional')})</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="e.g., 38.7223"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all dark:text-gray-100"
                />
              </div>

              {/* Longitude */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  {t('form.longitude')} <span className="text-gray-400 dark:text-gray-500 font-normal lowercase">({t('common.optional')})</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="e.g., -9.1393"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all dark:text-gray-100"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  {t('createReport.photoLabel')}
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-200 dark:border-gray-700 border-dashed rounded-2xl hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors group">
                  {imagePreview ? (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setImage(null); setImagePreview(null); }}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                      >
                        <AlertCircle className="w-5 h-5 rotate-45" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1 text-center">
                      <Camera className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 transition-colors" />
                      <div className="flex text-sm text-gray-600 dark:text-gray-400">
                        <label className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus-within:outline-none">
                          <span>{t('createReport.uploadFile')}</span>
                          <input type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                        </label>
                        <p className="pl-1">{t('createReport.dragDrop')}</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('createReport.fileLimits')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-2xl shadow-xl text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" />
                    {t('createReport.submitting')}
                  </>
                ) : (
                  <>
                    <Upload className="-ml-1 mr-3 h-6 w-6" />
                    {t('createReport.submitButton')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
