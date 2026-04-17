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
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { updateSettings } from '../services/settingsService';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.className}`}>
      {t(`status.${status}`)}
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
  const { t } = useTranslation();


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

function SiteSettingsManager() {
  const { settings, refreshSettings } = useSiteSettings();
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { t } = useTranslation();


  // Initialize form data from context settings
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await updateSettings(formData);
      await refreshSettings();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to apply settings.');
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { name: 'site_name', label: 'Site Name (EN)', type: 'text' },
    { name: 'site_name_pt', label: 'Nome do Site (PT)', type: 'text' },
    
    { name: 'site_tagline', label: 'Tagline (EN)', type: 'text' },
    { name: 'site_tagline_pt', label: 'Slogan (PT)', type: 'text' },
    
    { name: 'navbar_brand_text', label: 'Navbar Brand Text (EN)', type: 'text' },
    { name: 'navbar_brand_text_pt', label: 'Texto Marca Navbar (PT)', type: 'text' },
    
    { name: 'navbar_cta_text', label: 'Navbar CTA Text (EN)', type: 'text' },
    { name: 'navbar_cta_text_pt', label: 'Texto CTA Navbar (PT)', type: 'text' },
    
    { name: 'hero_title', label: 'Hero Title (EN)', type: 'text' },
    { name: 'hero_title_pt', label: 'Título Hero (PT)', type: 'text' },
    
    { name: 'hero_subtitle', label: 'Hero Subtitle (EN)', type: 'textarea' },
    { name: 'hero_subtitle_pt', label: 'Subtítulo Hero (PT)', type: 'textarea' },
    
    { name: 'hero_cta_text', label: 'Hero CTA Text (EN)', type: 'text' },
    { name: 'hero_cta_text_pt', label: 'Texto CTA Hero (PT)', type: 'text' },
    
    { name: 'empty_state_title', label: 'Empty State Title (EN)', type: 'text' },
    { name: 'empty_state_title_pt', label: 'Título Estado Vazio (PT)', type: 'text' },
    
    { name: 'empty_state_body', label: 'Empty State Body (EN)', type: 'text' },
    { name: 'empty_state_body_pt', label: 'Corpo Estado Vazio (PT)', type: 'text' },
    
    { name: 'about_title', label: 'About Title (EN)', type: 'text' },
    { name: 'about_title_pt', label: 'Título Sobre (PT)', type: 'text' },
    
    { name: 'about_body', label: 'About Body (EN)', type: 'textarea' },
    { name: 'about_body_pt', label: 'Corpo Sobre (PT)', type: 'textarea' },
    
    { name: 'footer_copyright_text', label: 'Footer Copyright (EN)', type: 'text' },
    { name: 'footer_copyright_text_pt', label: 'Rodapé Copyright (PT)', type: 'text' },

    { name: 'detail_official_response_label', label: 'Official Response Label (EN)', type: 'text' },
    { name: 'detail_official_response_label_pt', label: 'Rótulo Resposta Oficial (PT)', type: 'text' },

    { name: 'detail_support_title', label: 'Support Title (EN)', type: 'text' },
    { name: 'detail_support_title_pt', label: 'Título Suporte (PT)', type: 'text' },

    { name: 'detail_support_body', label: 'Support Body (EN)', type: 'text' },
    { name: 'detail_support_body_pt', label: 'Corpo Suporte (PT)', type: 'text' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">{t('admin.siteSettingsCms')}</h3>
        <button
          onClick={handleSave}
          disabled={saving}
          data-testid="save-settings-btn"
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {t('common.save')}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-2xl px-5 py-4 text-sm mb-6" role="alert">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 rounded-2xl px-5 py-4 text-sm mb-6" role="alert">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Settings successfully updated. Let's make changes!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map(f => (
          <div key={f.name} className={`${f.type === 'textarea' ? 'col-span-1 md:col-span-2' : ''}`}>
            <label className="block text-sm font-bold text-gray-700 mb-2">{f.label}</label>
            {f.type === 'textarea' ? (
              <textarea
                value={formData[f.name] || ''}
                onChange={(e) => handleChange(f.name, e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 outline-none"
              />
            ) : (
              <input
                type="text"
                value={formData[f.name] || ''}
                onChange={(e) => handleChange(f.name, e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-gray-50 outline-none"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryManager({ categories, onSaved, onDeleted }) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editNamePt, setEditNamePt] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { t } = useTranslation();


  const [newName, setNewName] = useState('');
  const [newNamePt, setNewNamePt] = useState('');
  const [newIcon, setNewIcon] = useState('');
  const [creating, setCreating] = useState(false);

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditNamePt(cat.name_pt || '');
    setEditIcon(cat.icon || '');
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditNamePt('');
    setEditIcon('');
    setError(null);
  };

  const saveEdit = async (id) => {
    if (!editName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await reportService.updateCategory(id, { 
        name: editName, 
        name_pt: editNamePt,
        icon: editIcon 
      });
      onSaved(updated);
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update category.');
    } finally {
      setSaving(false);
    }
  };

  const createCategory = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const created = await reportService.createCategory({ 
        name: newName, 
        name_pt: newNamePt,
        icon: newIcon 
      });
      onSaved(created); // We can just append to list
      setNewName('');
      setNewNamePt('');
      setNewIcon('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create category.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category? Linked reports will block deletion.')) return;
    setError(null);
    try {
      await reportService.deleteCategory(id);
      onDeleted(id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete category. Ensure no reports are linked.');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">{t('admin.manageCategories')}</h3>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-2xl px-5 py-4 text-sm mb-6" role="alert">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Create New Category */}
      <div className="flex flex-wrap items-center gap-3 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div className="flex-1 min-w-[200px] flex flex-col gap-2">
          <input
            type="text"
            placeholder={t('admin.newCategoryName')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="Nome (Portuguese)"
            value={newNamePt}
            onChange={(e) => setNewNamePt(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <input
          type="text"
          placeholder={t('admin.iconEmoji')}
          value={newIcon}
          onChange={(e) => setNewIcon(e.target.value)}
          className="w-32 px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={createCategory}
          disabled={creating || !newName.trim()}
          className="flex items-center justify-center self-end md:self-center px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors h-fit"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {t('admin.addCategory')}
        </button>
      </div>

      {/* Categories List */}
      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.id} className="flex flex-wrap items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-200 transition-colors">
            {editingId === cat.id ? (
              <div className="flex-1 flex flex-wrap items-center gap-3">
                <div className="flex-1 flex flex-col gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    value={editNamePt}
                    onChange={(e) => setEditNamePt(e.target.value)}
                    placeholder="Nome (Portuguese)"
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <input
                  type="text"
                  value={editIcon}
                  onChange={(e) => setEditIcon(e.target.value)}
                  placeholder={t('admin.iconEmoji')}
                  className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 self-start"
                />
                <div className="flex items-center gap-2 self-start">
                  <button
                    onClick={() => saveEdit(cat.id)}
                    disabled={saving}
                    className="text-xs font-bold px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50"
                  >
                    {t('common.save')}
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={saving}
                    className="text-xs font-bold px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{cat.icon || '📌'}</span>
                  <div>
                    <p className="font-bold text-gray-900">
                      {i18n.language === 'pt' && cat.name_pt ? cat.name_pt : cat.name}
                      {i18n.language === 'pt' && cat.name_pt && cat.name_pt !== cat.name && (
                         <span className="ml-2 text-xs font-normal text-gray-400">({cat.name})</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">{t('admin.categorySlug')}: {cat.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(cat)}
                    className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg"
                  >
                    {t('common.manage')}
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
                    title="Delete Category"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-4">{t('admin.noReports')}</p>
        )}
      </div>
    </div>
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
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'categories' | 'settings'
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const PAGE_SIZE = 10;
  const { t } = useTranslation();


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
    <div className="min-h-screen bg-gray-50" data-testid="admin-dashboard">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-gray-900 text-lg">{t('admin.dashboard')}</span>
              <span className="ml-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                {totalCount} {t('admin.reportsTab')}
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
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </header>

      {/* Sub-header Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex gap-6">
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'reports'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            {t('admin.reportsTab')}
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'categories'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                  className="pl-4 pr-10 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                  aria-label={t('status.all')}
                >
                  <option value="">{t('status.all')}</option>
                  <option value="open">{t('status.open')}</option>
                  <option value="in_progress">{t('status.in_progress')}</option>
                  <option value="resolved">{t('status.resolved')}</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('common.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
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
                  <p className="font-semibold">{t('admin.noReports')}</p>
                </div>
              ) : (
                <table className="w-full text-sm" data-testid="reports-table">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.table.title')}</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.table.category')}</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.table.status')}</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.table.date')}</th>
                      <th className="px-5 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.table.action')}</th>
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
                          {typeof report.category === 'object' 
                            ? (i18n.language === 'pt' && report.category.name_pt ? report.category.name_pt : report.category.name)
                            : report.category}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={report.status} />
                        </td>
                        <td className="px-5 py-4 text-gray-400">
                          {new Date(report.created_at).toLocaleDateString(i18n.language)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setSelectedReport(report)}
                            data-testid={`edit-btn-${report.id}`}
                            className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-100"
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
