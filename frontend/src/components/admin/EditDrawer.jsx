import { useState } from 'react';
import { reportService, normalizeMediaUrl } from '../../services/reportService';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { AlertCircle, X, ChevronDown, CheckCircle2, Loader2, Save, Trash2, Camera } from 'lucide-react';

export default function EditDrawer({ report, categories, onClose, onSaved, onDeleted }) {
  const [title, setTitle] = useState(report.title);
  const [description, setDescription] = useState(report.description);
  const [category, setCategory] = useState(
    typeof report.category === 'object' ? report.category.id : report.category
  );
  const [status, setStatus] = useState(report.status);
  const [comment, setComment] = useState(report.resolution_comment ?? '');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const { t, i18n } = useTranslation();

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = new FormData();
      payload.append('title', title);
      payload.append('description', description);
      payload.append('category', category);
      payload.append('status', status);
      payload.append('resolution_comment', comment);
      if (photo) {
        payload.append('photo', photo);
      }

      const updated = await reportService.updateReport(report.id, payload, !!photo);
      onSaved(updated);
      onClose();
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const existingPhotoUrl = normalizeMediaUrl(report.photo ?? report.image ?? null);

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
            <h2 className="font-bold text-gray-900 text-lg">{t('admin.editReport')}</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{report.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={t('common.cancel')}
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
            <label className="block text-sm font-bold text-gray-700 mb-2">{t('form.title')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          {/* Description input */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{t('form.description')}</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{t('form.photo')}</label>
            <div className="flex flex-col gap-3">
              {existingPhotoUrl && !photoPreview && (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={existingPhotoUrl}
                    alt="Current"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-2 left-2 text-xs font-bold bg-black/50 text-white px-2 py-1 rounded-lg">
                    Current
                  </span>
                </div>
              )}
              {photoPreview && (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 transition-colors text-sm font-medium text-gray-500 hover:text-indigo-600">
                <Camera className="w-4 h-4" />
                {photo ? t('createReport.uploadFile') : (existingPhotoUrl ? 'Replace photo' : 'Add photo')}
                <input type="file" className="sr-only" accept="image/*" onChange={handlePhotoChange} />
              </label>
            </div>
          </div>

          {/* Category Select */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{t('form.category')}</label>
            <div className="relative">
              <select
                value={category || ''}
                onChange={(e) => setCategory(Number(e.target.value))}
                className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none cursor-pointer"
              >
                <option value="">{t('admin.manageCategories')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {i18n.language === 'pt' && c.name_pt ? c.name_pt : c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Status Selector */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">{t('form.status')}</label>
            <div className="space-y-2">
              {['open', 'in_progress', 'resolved'].map((s) => {
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
                    {t(`status.${s}`)}
                    {status === s && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resolution Comment */}
          <div>
            <label htmlFor="resolution-comment" className="block text-sm font-bold text-gray-700 mb-2">
              {t('form.resolutionComment')}
              <span className="ml-1 font-normal text-gray-400">({t('common.optional')})</span>
            </label>
            <textarea
              id="resolution-comment"
              rows={5}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('form.resolutionPlaceholder')}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50"
            />
            <p className="text-xs text-gray-400 mt-1">
              {t('form.publicVisibilityNote')}
            </p>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button
            onClick={handleDelete}
            disabled={saving || deleting}
            className="flex items-center justify-center px-4 py-3 bg-red-100 text-red-700 font-bold rounded-xl hover:bg-red-200 disabled:opacity-50 transition-all border border-red-200"
            title={t('common.delete')}
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
              <><Loader2 className="w-4 h-4 animate-spin" /> {t('common.saving')}</>
            ) : (
              <><Save className="w-4 h-4" /> {t('common.save')}</>
            )}
          </button>
        </div>
      </motion.aside>
    </motion.div>
  );
}
