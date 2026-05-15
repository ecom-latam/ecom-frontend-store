'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmptyState, ICON_USERS } from '@/components/ui/EmptyState';

type Collaborator = {
  userId: string;
  email: string;
  role: 'Manager' | 'Seller';
};

const ROLE_LABELS: Record<string, string> = {
  Manager: 'Manager',
  Seller: 'Vendedor',
};

const EDITABLE_ROLES = ['Manager', 'Seller'];

function InvitePanel() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState('Manager');
  const [generating, setGenerating] = useState(false);
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);
  const linkRef = useRef<HTMLInputElement>(null);

  async function handleGenerate() {
    setGenerating(true);
    setLink('');
    try {
      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) { alert('No se pudo generar el link.'); return; }
      const data = await res.json() as { token: string };
      setLink(`${window.location.origin}/invite/${data.token}`);
    } catch {
      alert('Error de conexión.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      linkRef.current?.select();
    }
  }

  return (
    <div className="mb-6">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
        >
          Invitar colaborador
        </button>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-5 max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Generar link de invitación</h2>
            <button onClick={() => { setOpen(false); setLink(''); }} className="text-gray-400 hover:text-gray-600 text-sm">
              ✕
            </button>
          </div>

          <div className="flex gap-3 mb-4">
            <select
              value={role}
              onChange={(e) => { setRole(e.target.value); setLink(''); }}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
            >
              {EDITABLE_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-gray-900 text-white text-sm font-medium px-4 py-1.5 rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {generating ? 'Generando...' : 'Generar link'}
            </button>
          </div>

          {link && (
            <div className="flex gap-2">
              <input
                ref={linkRef}
                readOnly
                value={link}
                className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 bg-gray-50 focus:outline-none"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopy}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                {copied ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>
          )}

          {link && (
            <p className="text-xs text-gray-400 mt-2">El link expira en 72 horas.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminCollaboratorsPage() {
  const router = useRouter();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/collaborators');
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) { router.replace('/admin/login'); return; }
        setError('No se pudieron cargar los colaboradores.');
        return;
      }
      setCollaborators(await res.json());
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRoleChange(userId: string, role: string) {
    setSaving(userId);
    try {
      const res = await fetch(`/api/admin/collaborators/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) { alert('No se pudo cambiar el rol.'); return; }
      setCollaborators((prev) =>
        prev.map((c) => (c.userId === userId ? { ...c, role: role as Collaborator['role'] } : c))
      );
    } catch {
      alert('Error de conexión.');
    } finally {
      setSaving(null);
    }
  }

  async function handleRevoke(userId: string, email: string) {
    if (!confirm(`¿Revocar el acceso de "${email}"?`)) return;
    setSaving(userId);
    try {
      const res = await fetch(`/api/admin/collaborators/${userId}`, { method: 'DELETE' });
      if (!res.ok) { alert('No se pudo revocar el acceso.'); return; }
      setCollaborators((prev) => prev.filter((c) => c.userId !== userId));
    } catch {
      alert('Error de conexión.');
    } finally {
      setSaving(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Colaboradores</h1>
      </div>

      <InvitePanel />

      {loading && <p className="text-sm text-gray-500">Cargando colaboradores...</p>}
      {!loading && error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && collaborators.length === 0 && (
        <EmptyState
          icon={ICON_USERS}
          title="No hay colaboradores todavía."
          description="Usá el botón de arriba para generar un link de invitación."
          tone="neutral"
          bordered
        />
      )}

      {!loading && !error && collaborators.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Rol</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {collaborators.map((c) => (
                <tr key={c.userId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-900">{c.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={c.role}
                      disabled={saving === c.userId}
                      onChange={(e) => handleRoleChange(c.userId, e.target.value)}
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white disabled:opacity-50"
                    >
                      {EDITABLE_ROLES.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRevoke(c.userId, c.email)}
                      disabled={saving === c.userId}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50 text-sm"
                    >
                      {saving === c.userId ? 'Guardando...' : 'Revocar acceso'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
