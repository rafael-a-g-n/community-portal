import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import CreateReportPage from './pages/CreateReportPage';
import ReportDetailPage from './pages/ReportDetailPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';

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
                <Route path="/about" element={
                  <div className="max-w-3xl mx-auto px-4 py-20 text-center">
                    <h1 className="text-4xl font-bold mb-6">About Community Portal</h1>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      Community Portal is a community-driven platform designed to bridge the gap
                      between citizens and local authorities. By providing a transparent and
                      easy-to-use interface for reporting infrastructure, safety, and environmental
                      issues, we empower residents to take an active role in improving their
                      neighborhoods.
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
                      <span className="text-white text-[10px] font-bold">CP</span>
                    </div>
                    <span className="text-lg font-bold tracking-tight text-gray-900">Community Portal</span>
                  </div>

                  <div className="flex space-x-6 text-sm font-medium text-gray-500">
                    <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-indigo-600 transition-colors">Contact</a>
                  </div>

                  <p className="text-sm text-gray-400">
                    © {new Date().getFullYear()} Community Portal. All rights reserved.
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
