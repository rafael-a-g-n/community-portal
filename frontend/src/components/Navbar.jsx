import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, ClipboardList, Menu, X, Sun, Moon } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useTheme } from '../context/ThemeContext';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const { localizedSettings } = useSiteSettings();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/about', label: t('nav.about') },
    { to: '/track', label: t('track.title') },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <ClipboardList className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{localizedSettings?.navbar_brand_text}</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {link.label}
              </Link>
            ))}

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2" />

            <button
              onClick={toggleTheme}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              aria-label={t('nav.themeToggle')}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <LanguageSwitcher />

            <Link
              to="/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              {localizedSettings?.navbar_cta_text}
            </Link>
          </div>

          {/* Mobile Nav */}
          <div className="flex items-center md:hidden gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              aria-label={t('nav.themeToggle')}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <LanguageSwitcher />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden border-t border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-2">
                <Link
                  to="/create"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  {localizedSettings?.navbar_cta_text}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
