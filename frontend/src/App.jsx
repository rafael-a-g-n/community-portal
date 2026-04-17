import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import { useTranslation } from 'react-i18next';
import HomePage from './pages/HomePage';
import CreateReportPage from './pages/CreateReportPage';
import ReportDetailPage from './pages/ReportDetailPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import { useSiteSettings } from './context/SiteSettingsContext';

export default function App() {
  const { localizedSettings } = useSiteSettings();
  const { t } = useTranslation();

  return (
    <Router>
      <Routes>
        {/* Admin routes — no Navbar/Footer wrapper */}
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* Public routes — with Navbar/Footer */}
        <Route path="/*" element={
          <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/create" element={<CreateReportPage />} />
                <Route path="/reports/:id" element={<ReportDetailPage />} />
                <Route path="/about" element={
                  <div className="max-w-3xl mx-auto px-4 py-20 text-center">
                    <h1 className="text-4xl font-bold mb-6">{localizedSettings?.about_title}</h1>
                    <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {localizedSettings?.about_body}
                    </p>
                  </div>
                } />
              </Routes>
            </main>

            <footer className="bg-white border-t border-gray-100 py-12 mt-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">
                        {localizedSettings?.site_name
                          ?.split(' ')
                          .filter(word => word.length > 0)
                          .map(word => word[0])
                          .join('')
                          .toUpperCase()}
                      </span>
                    </div>
                    <span className="text-lg font-bold tracking-tight text-gray-900">{localizedSettings?.site_name}</span>
                  </div>

                  <div className="flex space-x-6 text-sm font-medium text-gray-500">
                    <a href="#" className="hover:text-indigo-600 transition-colors">{t('nav.privacyPolicy')}</a>
                    <a href="#" className="hover:text-indigo-600 transition-colors">{t('nav.termsOfService')}</a>
                    <a href="#" className="hover:text-indigo-600 transition-colors">{t('nav.contact')}</a>
                  </div>

                  <p className="text-sm text-gray-400 flex flex-col sm:flex-row gap-1 sm:gap-2 text-center sm:text-left">
                    <span>© {new Date().getFullYear()} {localizedSettings?.site_name}. {t('nav.rightsReserved')}</span>
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
          </div>
        } />
      </Routes>
    </Router>
  );
}
