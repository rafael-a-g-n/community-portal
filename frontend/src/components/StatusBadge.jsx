import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

export const STATUS_CONFIG = {
  open: 'bg-amber-100 text-amber-700 border-amber-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
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
