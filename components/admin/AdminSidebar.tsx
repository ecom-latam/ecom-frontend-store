'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminRole } from '@/app/admin/(panel)/AdminRoleProvider';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', roles: null },
  { label: 'Productos', href: '/admin/products', roles: null },
  { label: 'Categorías', href: '/admin/categories', roles: ['Admin', 'Manager'] },
  { label: 'Variables', href: '/admin/variables', roles: ['Admin', 'Manager'] },
  { label: 'Colaboradores', href: '/admin/collaborators', roles: ['Admin'] },
];

type Props = { slug: string };

export default function AdminSidebar({ slug }: Props) {
  const pathname = usePathname();
  const role = useAdminRole();

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.roles === null || (role !== null && item.roles.includes(role))
  );

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-200">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Tienda</p>
        <p className="text-sm font-semibold text-gray-900 truncate">{slug}</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const isActive =
            item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-200">
        <button
          type="button"
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/admin/login';
          }}
          className="btn btn--ghost btn--rounded btn--sm"
          style={{ width: '100%', justifyContent: 'flex-start' }}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
