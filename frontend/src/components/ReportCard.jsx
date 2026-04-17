import { cn } from '../lib/utils';
import { Calendar, Tag, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

import StatusBadge from './StatusBadge';
export default function ReportCard({ report }) {
  const { t, i18n } = useTranslation();
  const category = typeof report.category === 'object' ? report.category : { name: t('status.unknown') };
  const imageUrl = report.photo ?? report.image;
  
  const categoryName = i18n.language === 'pt' && category.name_pt 
    ? category.name_pt 
    : category.name;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <Link to={`/reports/${report.id}`}>
        <div className="aspect-video w-full overflow-hidden bg-gray-100 relative">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={report.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <MapPin className="w-12 h-12 opacity-20" />
            </div>
          )}
          <div className="absolute top-4 left-4">
            <StatusBadge status={report.status} />
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center space-x-2 text-xs font-medium text-indigo-600 mb-2">
            <Tag className="w-3 h-3" />
            <span>{categoryName || t('status.unknown')}</span>
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {report.title}
          </h3>
          
          <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[2.5rem]">
            {report.description}
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-xs text-gray-400">
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(report.created_at).toLocaleDateString(i18n.language)}
            </div>
            <span className="font-medium text-indigo-600 group-hover:translate-x-1 transition-transform">
              {t('home.viewDetail')} →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
