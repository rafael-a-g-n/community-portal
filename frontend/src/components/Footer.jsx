import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSiteSettings } from '../context/SiteSettingsContext';

export default function Footer() {
  const { localizedSettings } = useSiteSettings();
  const { t } = useTranslation();

  return (
    <footer className="bg-white border-t border-gray-100 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">
                {localizedSettings?.site_name
                  ?.split(' ')
                  .filter((word) => word.length > 0)
                  .map((word) => word[0])
                  .join('')
                  .toUpperCase()}
              </span>
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              {localizedSettings?.site_name}
            </span>
          </div>

          <div className="flex space-x-6 text-sm font-medium text-gray-500">
            <Link to="/privacy" className="hover:text-indigo-600 transition-colors">
              {t('nav.privacyPolicy')}
            </Link>
            <Link to="/terms" className="hover:text-indigo-600 transition-colors">
              {t('nav.termsOfService')}
            </Link>
            <Link to="/contact" className="hover:text-indigo-600 transition-colors">
              {t('nav.contact')}
            </Link>
            <Link to="/track" className="hover:text-indigo-600 transition-colors">
              {t('track.title')}
            </Link>
          </div>

          <p className="text-sm text-gray-400 flex flex-col sm:flex-row gap-1 sm:gap-2 text-center sm:text-left">
            <span>
              © {new Date().getFullYear()} {localizedSettings?.site_name}. {t('nav.rightsReserved')}
            </span>
            {localizedSettings?.footer_copyright_text && (
              <span className="hidden sm:inline">| {localizedSettings?.footer_copyright_text}</span>
            )}
            {localizedSettings?.footer_copyright_text && (
              <span className="sm:hidden">{localizedSettings?.footer_copyright_text}</span>
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}
