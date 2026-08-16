import { NavLink } from 'react-router';
import { cn } from '../../lib/utils';

const sections = [
  { label: 'Overview', path: '/admin', end: true },
  { label: 'Products', path: '/admin/products' },
  { label: 'Orders', path: '/admin/orders' },
  { label: 'Inventory', path: '/admin/inventory' },
];

export function AdminSectionNav() {
  return (
    <nav aria-label="Admin sections" className="overflow-x-auto" data-testid="admin-section-nav">
      <div className="inline-flex min-w-full gap-1 rounded-2xl border border-stone-200 bg-stone-50 p-1 sm:min-w-0">
        {sections.map((section) => (
          <NavLink
            key={section.path}
            to={section.path}
            end={section.end}
            className={({ isActive }) => cn(
              'flex-1 whitespace-nowrap rounded-xl px-3 py-2 text-center text-sm font-medium transition sm:flex-none sm:px-4',
              isActive
                ? 'bg-slate-950 text-white shadow-sm'
                : 'text-slate-600 hover:bg-white hover:text-slate-950'
            )}
            data-testid={`admin-section-${section.label.toLowerCase()}`}
          >
            {section.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
