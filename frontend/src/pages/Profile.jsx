import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { ArrowLeft, Camera, KeyRound, Save } from 'lucide-react';
import Avatar from '../components/ui/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { authApi, userApi } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fullStamp } from '../utils/format.js';
import { useStaggerChildren } from '../hooks/useMotion.js';

const FIELDS = [
  { key: 'name', label: 'Full name', placeholder: 'Jasmin Lowery' },
  { key: 'email', label: 'Email', placeholder: 'you@example.com', readOnly: true },
  { key: 'mobile', label: 'Mobile number', placeholder: '+1 555 0100' },
  { key: 'address', label: 'Address', placeholder: 'Street, city, country' },
  { key: 'work', label: 'Work', placeholder: 'Product designer at Acme' },
  { key: 'studies', label: 'Studies', placeholder: 'BSc Computer Science' },
  { key: 'about', label: 'About', placeholder: 'A short line about you' },
];

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const fileRef = useRef(null);
  const formRef = useStaggerChildren([], { stagger: 0.08, distance: 18 });

  const [form, setForm] = useState({});
  const [preview, setPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });

  useEffect(() => {
    if (!user) return;
    setForm(
      FIELDS.reduce((acc, field) => ({ ...acc, [field.key]: user[field.key] || '' }), {})
    );
  }, [user]);

  const pickAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      FIELDS.filter((field) => !field.readOnly).forEach((field) =>
        formData.append(field.key, form[field.key] ?? '')
      );
      if (avatarFile) formData.append('avatar', avatarFile);

      const { user: updated } = await userApi.updateProfile(formData);
      updateUser(updated);
      setAvatarFile(null);
      setPreview(null);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    try {
      await authApi.changePassword(passwords);
      setPasswords({ currentPassword: '', newPassword: '' });
      setPasswordOpen(false);
      toast.success('Password changed');
    } catch (error) {
      toast.error(error.message);
    }
  };

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
        <div>
          <h1 className="text-lg font-semibold text-ink-900">My profile</h1>
          <p className="text-xs text-ink-400">Member since {fullStamp(user?.createdAt)}</p>
        </div>
      </header>

      <form ref={formRef} onSubmit={save} className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
        <section className="card relative overflow-hidden p-6 pt-20 sm:pt-6">
          {/* Cover band, echoing the brand panel on the sign-in screen. */}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-24 bg-brand-gradient sm:hidden"
          />
          <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <div className="relative">
            <Avatar src={preview || user?.avatar} name={user?.name} size="xl" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="press absolute -bottom-1 -right-1 rounded-full bg-brand-gradient p-2 text-white shadow-glow transition hover:scale-110 hover:brightness-110"
              aria-label="Change profile picture"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickAvatar} />
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h2 className="truncate text-xl font-semibold text-ink-900">{user?.name}</h2>
            <p className="truncate text-sm text-ink-400">{user?.email}</p>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-2.5 py-1 text-xs font-semibold capitalize text-brand-700 ring-1 ring-inset ring-brand-500/20 dark:text-brand-300">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              {user?.role}
            </span>
          </div>
          <Button variant="outline" onClick={() => setPasswordOpen(true)}>
            <KeyRound className="h-4 w-4" /> Change password
          </Button>
          </div>
        </section>

        <section className="card grid gap-4 p-6 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <div
              key={field.key}
              className={clsx('group', field.key === 'about' && 'sm:col-span-2')}
            >
              <label
                className="label transition-colors group-focus-within:text-brand-600 dark:group-focus-within:text-brand-300"
                htmlFor={field.key}
              >
                {field.label}
              </label>
              <input
                id={field.key}
                className="input disabled:bg-ink-50 disabled:text-ink-400"
                value={form[field.key] || ''}
                placeholder={field.placeholder}
                disabled={field.readOnly}
                onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
              />
              {field.readOnly && (
                <p className="mt-1 text-[11px] text-ink-400">Only an admin can change your email.</p>
              )}
            </div>
          ))}
        </section>

        <div className="flex justify-end">
          <Button type="submit" size="lg" loading={saving}>
            <Save className="h-4 w-4" /> Save changes
          </Button>
        </div>
      </form>

      <Modal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        title="Change password"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPasswordOpen(false)}>
              Cancel
            </Button>
            <Button onClick={savePassword}>Update</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="currentPassword">
              Current password
            </label>
            <input
              id="currentPassword"
              type="password"
              className="input"
              value={passwords.currentPassword}
              onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="newPassword">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              className="input"
              value={passwords.newPassword}
              onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;
