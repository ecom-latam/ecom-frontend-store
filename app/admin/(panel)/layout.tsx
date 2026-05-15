import { headers } from 'next/headers';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { AdminRoleProvider } from './AdminRoleProvider';

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const headerStore = await headers();
  const slug = headerStore.get('x-store-slug') ?? '';

  return (
    <AdminRoleProvider>
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar slug={slug} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </AdminRoleProvider>
  );
}
