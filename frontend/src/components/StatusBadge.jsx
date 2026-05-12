import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

export const STATUS_CONFIG = {
  open: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  in_progress: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  resolved: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
};

export default function StatusBadge({ status, className }) {
  const { t } = useTranslation();
  
  const statusClass = STATUS_CONFIG[status] || 'bg-gray-100 text-gray-600 border-gray-200';
  const label = status ? t(`status.${status}`) : t('status.unknown');

  return (
    <span 
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border', 
        statusClass,
        className
      )}
    >
      {label}
    </span>
  );
}
