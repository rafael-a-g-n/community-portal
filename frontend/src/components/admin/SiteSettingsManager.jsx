import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { updateSettings } from '../../services/settingsService';
import { Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SiteSettingsManager() {
  const { settings, refreshSettings } = useSiteSettings();
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
        {fields.map((f) => (
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
