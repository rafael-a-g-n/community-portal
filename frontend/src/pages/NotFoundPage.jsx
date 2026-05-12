import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Home, SearchX } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-24 h-24 bg-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <SearchX className="w-12 h-12 text-indigo-600" />
        </div>

        <h1 className="text-6xl font-extrabold text-gray-900 dark:text-gray-100 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
          {t('notFound.title', 'Page not found')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-sm mx-auto">
          {t('notFound.description', "The page you're looking for doesn't exist or has been moved.")}
        </p>

        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
        >
          <Home className="w-4 h-4" />
          {t('nav.home')}
        </button>
      </motion.div>
    </div>
  );
}
