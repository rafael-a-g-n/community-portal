import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreateReportPage from './pages/CreateReportPage';
import ReportDetailPage from './pages/ReportDetailPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import PublicLayout from './components/PublicLayout';
import AboutPage from './pages/AboutPage';

export default function App() {

  return (
    <Router>
      <Routes>
        {/* Admin routes — no Navbar/Footer wrapper */}
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* Public routes — with Navbar/Footer via PublicLayout */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreateReportPage />} />
          <Route path="/reports/:id" element={<ReportDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
