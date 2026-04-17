import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import { useTranslation } from 'react-i18next';
import HomePage from './pages/HomePage';
import CreateReportPage from './pages/CreateReportPage';
import ReportDetailPage from './pages/ReportDetailPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import { useSiteSettings } from './context/SiteSettingsContext';

import Footer from './components/Footer';
import AboutPage from './pages/AboutPage';

export default function App() {

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
                <Route path="/about" element={<AboutPage />} />
              </Routes>
            </main>

            <Footer />
          </div>
        } />
      </Routes>
    </Router>
  );
}
