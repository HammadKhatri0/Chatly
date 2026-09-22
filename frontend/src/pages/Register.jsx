import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MessagesSquare } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      toast.success('Account created');
      navigate('/chats', { replace: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
    return undefined;
  };

  const field = (id, label, type = 'text', placeholder = '') => (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        required
        className="input"
        value={form[id]}
        placeholder={placeholder}
        onChange={(event) => setForm({ ...form, [id]: event.target.value })}
      />
    </div>
  );

  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-br from-brand-50 via-ink-50 to-white p-4">
      <div className="card w-full max-w-md p-7">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <MessagesSquare className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-semibold text-ink-900">Create your account</h1>
          <p className="text-sm text-ink-400">It only takes a moment.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {field('name', 'Full name', 'text', 'Jasmin Lowery')}
          {field('email', 'Email', 'email', 'you@example.com')}
          {field('password', 'Password', 'password', 'At least 6 characters')}
          {field('confirm', 'Confirm password', 'password', 'Repeat your password')}

          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Create account
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
