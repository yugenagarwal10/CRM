import { useStatuses } from '../context/StatusContext';
import type { LeadStatus } from '../types';

export default function StatusBadge({ status }: { status: LeadStatus }) {
  const { getStatusColorClasses } = useStatuses();
  const className = getStatusColorClasses(status);
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${className}`}>
      {status}
    </span>
  );
}
