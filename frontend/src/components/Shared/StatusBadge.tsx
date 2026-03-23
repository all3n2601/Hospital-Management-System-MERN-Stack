const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  // Billing statuses
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  issued: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  void: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  // Lab order statuses (pending + cancelled already covered above)
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  // Lab result statuses
  preliminary: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  final: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  amended: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  // Pharmacy prescription statuses (draft + cancelled already covered above)
  dispensed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  // Lab priority statuses
  routine: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  urgent: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  stat: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const styles = STATUS_STYLES[status.toLowerCase()] ?? STATUS_STYLES['inactive'];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles}`}
    >
      {label ?? status}
    </span>
  );
}
