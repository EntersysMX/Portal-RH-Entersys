import { clsx } from 'clsx';

const statusStyles: Record<string, string> = {
  Active: 'badge-success',
  active: 'badge-success',
  Present: 'badge-success',
  Approved: 'badge-success',
  Completed: 'badge-success',
  Accepted: 'badge-success',
  Paid: 'badge-success',
  Submitted: 'badge-info',
  Open: 'badge-warning',
  'Work From Home': 'badge-info',
  Pending: 'badge-warning',
  Draft: 'badge-neutral',
  Scheduled: 'badge-info',
  'Half Day': 'badge-warning',
  Hold: 'badge-warning',
  Unpaid: 'badge-warning',
  Inactive: 'badge-neutral',
  Absent: 'badge-danger',
  Rejected: 'badge-danger',
  Cancelled: 'badge-danger',
  Left: 'badge-danger',
  Suspended: 'badge-danger',
  Closed: 'badge-neutral',
  'On Leave': 'badge-info',
  Replied: 'badge-info',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={clsx(statusStyles[status] || 'badge-neutral', className)}>
      {status}
    </span>
  );
}
