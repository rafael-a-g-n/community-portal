import { Link } from 'react-router-dom';
import { PlusCircle, ClipboardList } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export default function Navbar() {
  const { localizedSettings } = useSiteSettings();
  const { t } = useTranslation();

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <ClipboardList className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">{localizedSettings?.navbar_brand_text}</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
              {t('nav.home')}
            </Link>
            <Link to="/about" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
              {t('nav.about')}
            </Link>
            
            <div className="h-6 w-px bg-gray-200 mx-2" />
            
            <LanguageSwitcher />

            <Link 
              to="/create" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              {localizedSettings?.navbar_cta_text}
            </Link>
          </div>

          <div className="flex items-center md:hidden gap-2">
            <LanguageSwitcher />
            <Link to="/create" className="p-2 text-indigo-600">
              <PlusCircle className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
