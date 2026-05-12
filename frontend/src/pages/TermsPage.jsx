import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, FileText } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';

export default function TermsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { localizedSettings } = useSiteSettings();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        {t('common.back')}
      </button>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">{t('nav.termsOfService')}</h1>
        </div>
        <div className="prose prose-indigo max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
          {localizedSettings?.terms_body ? (
            <p>{localizedSettings.terms_body}</p>
          ) : (
            <p className="text-gray-400 italic">{t('contact.noContent')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
