import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { StatusBadge } from '../components/ReportCard';
import { 
  ArrowLeft, 
  Calendar, 
  Tag, 
  Clock, 
  MapPin, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Settings2
} from 'lucide-react';
import { motion } from 'motion/react';

export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadReport() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await reportService.getReport(id);
        setReport(data);
      } catch (err) {
        setError('Report not found or failed to load.');
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [id]);

  const handleStatusUpdate = async (newStatus) => {
    if (!id || !report) return;
    try {
      setUpdating(true);
      const updated = await reportService.updateReport(id, { status: newStatus });
      setReport(updated);
    } catch (err) {
      alert('Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40" data-testid="detail-loader">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading report details...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center" data-testid="detail-error">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-600 mb-8">{error || 'Report not found.'}</p>
        <button 
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-all"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const category = typeof report.category === 'object' ? report.category : { name: 'Unknown' };
  const imageUrl = report.photo ?? report.image;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="detail-view">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Reports
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="aspect-video w-full bg-gray-100 relative">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={report.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <MapPin className="w-20 h-20 opacity-10" />
                </div>
              )}
            </div>
            
            <div className="p-8 sm:p-10">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <StatusBadge status={report.status} />
                <div className="flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">
                  <Tag className="w-3 h-3 mr-1.5" />
                  {category.name}
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
                {report.title}
              </h1>

              <div className="prose prose-indigo max-w-none text-gray-600 leading-relaxed mb-10">
                <p className="whitespace-pre-wrap">{report.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-8 border-t border-gray-100">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Reported On</p>
                    <p className="text-sm font-semibold text-gray-700">
                      {new Date(report.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <Clock className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Last Updated</p>
                    <p className="text-sm font-semibold text-gray-700">
                      {new Date(report.updated_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar / Actions */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100"
          >
            <div className="flex items-center space-x-2 mb-6">
              <Settings2 className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-gray-900">Manage Report</h3>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Update Status</p>
              
              {['open', 'in_progress', 'resolved'].map((status) => {
                const label = status.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
                return (
                  <button
                    key={status}
                    disabled={updating || report.status === status}
                    onClick={() => handleStatusUpdate(status)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      report.status === status
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    } disabled:opacity-50`}
                  >
                    {label}
                    {report.status === status && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>

            {updating && (
              <div className="mt-4 flex items-center justify-center text-xs text-indigo-600 font-medium animate-pulse">
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                Updating status...
              </div>
            )}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-indigo-600 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden group"
          >
            <div className="relative z-10">
              <h4 className="text-xl font-bold mb-2">Need Help?</h4>
              <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
                If you have more information about this issue, please contact our community support team.
              </p>
              <button className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors">
                Contact Support
              </button>
            </div>
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-indigo-500 rounded-full opacity-20 group-hover:scale-110 transition-transform duration-500" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
