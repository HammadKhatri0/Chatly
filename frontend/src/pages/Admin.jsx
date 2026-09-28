import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import {
  ArrowLeft,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
} from 'lucide-react';
import Avatar from '../components/ui/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { EmptyState, Loading } from '../components/ui/Feedback.jsx';
import { adminApi } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useChat } from '../context/ChatContext.jsx';
import { fullStamp } from '../utils/format.js';
import useDebouncedValue from '../hooks/useDebouncedValue.js';
import { useCountUp, useStaggerChildren } from '../hooks/useMotion.js';

const EMPTY_USER = {
  name: '',
  email: '',
  password: '',
  role: 'user',
  mobile: '',
  address: '',
  work: '',
  studies: '',
  about: '',
  isBlocked: false,
};

const StatCard = ({ label, value }) => {
  // Counts up from zero so a refreshed dashboard reads as live, not static.
  const numberRef = useCountUp(value ?? 0);

  return (
    <div className="card hover-lift group relative overflow-hidden p-4">
      {/* Rail fills in on hover — the only motion a metric tile needs. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1 origin-top scale-y-0 bg-brand-gradient transition-transform duration-300 group-hover:scale-y-100"
      />
      <p className="text-xs uppercase tracking-wider text-ink-400">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums text-ink-900">
        {value === undefined || value === null ? '—' : <span ref={numberRef}>0</span>}
      </p>
    </div>
  );
};

const Admin = () => {
  const navigate = useNavigate();
  const { user: me, updateUser } = useAuth();
  const { startDirectChat, openConversation } = useChat();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_USER);
  const [saving, setSaving] = useState(false);
  const debounced = useDebouncedValue(term, 350);
  const statsRef = useStaggerChildren([stats], { stagger: 0.05 });
  const rowsRef = useStaggerChildren([users], { selector: 'tr', stagger: 0.03 });
  const chatsRef = useStaggerChildren([conversations], { stagger: 0.04 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, conversationsRes] = await Promise.all([
        adminApi.stats(),
        adminApi.users({ q: debounced.trim(), page, limit: 15 }),
        adminApi.conversations({ limit: 10 }),
      ]);
      setStats(statsRes.stats);
      setUsers(usersRes.users);
      setConversations(conversationsRes.conversations);
      setMeta({ total: usersRes.total, page: usersRes.page, pages: usersRes.pages });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [debounced, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debounced]);

  const openEditor = (target) => {
    setCreating(false);
    setEditing(target);
    setForm({ ...EMPTY_USER, ...target, password: '' });
  };

  const openCreator = () => {
    setCreating(true);
    setEditing(null);
    setForm(EMPTY_USER);
  };

  const submit = async () => {
    setSaving(true);
    try {
      if (creating) {
        await adminApi.createUser(form);
        toast.success('User created');
      } else {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        const { user: updated } = await adminApi.updateUser(editing._id, payload);
        if (String(updated._id) === String(me._id)) updateUser(updated);
        toast.success('User updated');
      }
      setEditing(null);
      setCreating(false);
      await load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (target) => {
    if (!window.confirm(`Delete ${target.name}? This removes their messages and cannot be undone.`)) return;
    try {
      await adminApi.deleteUser(target._id);
      toast.success('User deleted');
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const message = async (target) => {
    try {
      const conversation = await startDirectChat(target._id);
      openConversation(conversation._id);
      navigate(`/chats/${conversation._id}`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const field = (key, label, type = 'text') => (
    <div>
      <label className="label" htmlFor={`admin-${key}`}>
        {label}
      </label>
      <input
        id={`admin-${key}`}
        type={type}
        className="input"
        value={form[key] ?? ''}
        onChange={(event) => setForm({ ...form, [key]: event.target.value })}
      />
    </div>
  );

  return (
    <div className="chat-canvas scroll-slim h-full w-full overflow-y-auto">
      <header className="glass sticky top-0 z-10 flex items-center gap-3 border-b px-4 py-4">
        <button
          type="button"
          onClick={() => navigate('/chats')}
          className="press rounded-xl p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-800 md:hidden"
          aria-label="Back to inbox"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow">
          <Shield className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-ink-900">Admin panel</h1>
          <p className="text-xs text-ink-400">Full access to every account and conversation.</p>
        </div>
        <Button variant="ghost" onClick={load} aria-label="Refresh">
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button onClick={openCreator}>
          <Plus className="h-4 w-4" /> New user
        </Button>
      </header>

      <div className="space-y-5 p-4 sm:p-6">
        <section ref={statsRef} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Users" value={stats?.users} />
          <StatCard label="Online now" value={stats?.online} />
          <StatCard label="Group chats" value={stats?.groups} />
          <StatCard label="Direct chats" value={stats?.directChats} />
          <StatCard label="Messages" value={stats?.messages} />
          <StatCard label="Admins" value={stats?.admins} />
          <StatCard label="Pending requests" value={stats?.pendingRequests} />
          <StatCard label="Results" value={meta.total} />
        </section>

        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
            <h2 className="text-sm font-semibold text-ink-900">All users</h2>
            <div className="relative ml-auto w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Search by name or email"
                className="input pl-9"
              />
            </div>
          </div>

          {loading ? (
            <Loading label="Loading users…" />
          ) : users.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-raised text-xs uppercase tracking-wider text-ink-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody ref={rowsRef} className="divide-y divide-line">
                  {users.map((row) => (
                    <tr key={row._id} className="transition-colors hover:bg-brand-500/[0.04]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar src={row.avatar} name={row.name} size="sm" online={row.isOnline} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink-900">{row.name}</p>
                            <p className="truncate text-xs text-ink-400">{row.work || row.about || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-ink-800">{row.email}</p>
                        <p className="text-xs text-ink-400">{row.mobile || 'No mobile'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={clsx(
                            'rounded-full px-2 py-1 text-xs font-semibold capitalize ring-1 ring-inset',
                            row.role === 'admin'
                              ? 'bg-brand-500/10 text-brand-700 ring-brand-500/20 dark:text-brand-300'
                              : 'bg-ink-100 text-ink-600 ring-transparent'
                          )}
                        >
                          {row.role}
                        </span>
                        {row.isBlocked && (
                          <span className="ml-1 rounded-lg bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-500">
                            blocked
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-400">{fullStamp(row.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => message(row)}
                            className="press rounded-lg p-2 text-ink-400 transition hover:bg-brand-500/10 hover:text-brand-600"
                            aria-label={`Message ${row.name}`}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditor(row)}
                            className="press rounded-lg p-2 text-ink-400 transition hover:bg-brand-500/10 hover:text-brand-600"
                            aria-label={`Edit ${row.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(row)}
                            disabled={String(row._id) === String(me._id)}
                            className="rounded-lg p-2 text-ink-400 hover:bg-rose-500/10 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`Delete ${row.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={Search} title="No users found" description="Try a different search term." />
          )}

          {meta.pages > 1 && (
            <div className="flex items-center justify-between border-t border-line p-4 text-sm">
              <span className="text-ink-400">
                Page {meta.page} of {meta.pages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </section>

        <section className="card overflow-hidden">
          <div className="border-b border-line p-4">
            <h2 className="text-sm font-semibold text-ink-900">Latest conversations</h2>
            <p className="text-xs text-ink-400">
              Admins can open and moderate any chat, including ones they are not part of.
            </p>
          </div>
          <ul ref={chatsRef} className="divide-y divide-ink-100">
            {conversations.map((conversation) => (
              <li key={conversation._id} className="flex items-center gap-3 p-4">
                <Avatar
                  src={conversation.avatar}
                  name={conversation.isGroup ? conversation.name : conversation.members[0]?.name}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-900">
                    {conversation.isGroup
                      ? conversation.name
                      : conversation.members.map((member) => member.name).join(' ↔ ')}
                  </p>
                  <p className="truncate text-xs text-ink-400">
                    {conversation.members.length} members ·{' '}
                    {conversation.lastMessage?.text || 'No messages yet'}
                  </p>
                </div>
                <span className="hidden shrink-0 text-xs text-ink-400 sm:block">
                  {fullStamp(conversation.lastMessageAt)}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    openConversation(conversation._id);
                    navigate(`/chats/${conversation._id}`);
                  }}
                >
                  Open
                </Button>
              </li>
            ))}
            {!conversations.length && !loading && (
              <li className="p-6 text-center text-sm text-ink-400">No conversations yet.</li>
            )}
          </ul>
        </section>
      </div>

      <Modal
        open={Boolean(editing) || creating}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
        title={creating ? 'Create user' : `Edit ${editing?.name || ''}`}
        description="Admins can change any field, including email, role and password."
        size="lg"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setEditing(null);
                setCreating(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={submit} loading={saving}>
              {creating ? 'Create' : 'Save changes'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {field('name', 'Full name')}
          {field('email', 'Email', 'email')}
          {field('password', creating ? 'Password' : 'New password (optional)', 'password')}
          <div>
            <label className="label" htmlFor="admin-role">
              Role
            </label>
            <select
              id="admin-role"
              className="input"
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value })}
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>
          {field('mobile', 'Mobile number')}
          {field('address', 'Address')}
          {field('work', 'Work')}
          {field('studies', 'Studies')}
          <div className="sm:col-span-2">{field('about', 'About')}</div>
          <label className="flex items-center gap-2 text-sm text-ink-600 sm:col-span-2">
            <input
              type="checkbox"
              checked={Boolean(form.isBlocked)}
              onChange={(event) => setForm({ ...form, isBlocked: event.target.checked })}
              className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-300"
            />
            Block this account from signing in
          </label>
        </div>
      </Modal>
    </div>
  );
};

export default Admin;
