import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date as a relative time string in the user's timezone
 * Examples: "5 minutes ago", "2 hours ago", "3 days ago", "Oct 28"
 */
export function formatRelativeTime(date: Date | null | undefined): string {
  if (!date) return '—';

  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const _diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  // For dates older than 1 week, show as date
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...(new Date(date).getFullYear() !== now.getFullYear() && {
      year: '2-digit',
    }),
  });
  return formatter.format(new Date(date));
}

/**
 * Check if the application is running in a production environment (e.g., Vercel)
 */
export function isProduction() {
  if (typeof window === 'undefined')
    return process.env.NODE_ENV === 'production';
  return (
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1' &&
    !window.location.hostname.endsWith('.local')
  );
}

/**
 * Check if a database connection is considered "local" to the user's machine
 */
export function isLocalConnection(host: string | null) {
  if (!host) return false; // Don't assume local if host is missing
  const localHosts = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];
  return localHosts.includes(host.toLowerCase()) || host.endsWith('.local');
}
