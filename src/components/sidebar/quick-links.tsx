'use client';

import { Code, Info, Plus, Table } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '~/lib/utils';

interface QuickLinksProps {
  dbname: string;
}

const links = [
  { href: 'tables', label: 'Tables', icon: Table },
  { href: 'query', label: 'Saved Queries', icon: Code },
  { href: 'query/new', label: 'New Query', icon: Plus },
  { href: 'info', label: 'Database Info', icon: Info },
];

export function QuickLinks({ dbname }: QuickLinksProps) {
  const pathname = usePathname();

  return (
    <div className="px-4 py-2">
      <p className="mb-2 font-semibold text-sidebar-foreground/60 text-xs uppercase tracking-wider">
        Quick Links
      </p>
      <nav className="space-y-1">
        {links.map((link) => {
          const fullPath = `/home/${dbname}/${link.href}`;
          const isActive =
            pathname === fullPath ||
            (link.href === 'tables' && pathname === `/home/${dbname}`) ||
            (link.href !== 'query/new' &&
              link.href === 'query' &&
              pathname.startsWith(`/home/${dbname}/query`) &&
              !pathname.includes('/new'));

          return (
            <Link
              key={link.href}
              href={fullPath}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <link.icon className="h-4 w-4 shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
