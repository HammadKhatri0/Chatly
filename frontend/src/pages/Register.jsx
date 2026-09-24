import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../components/layout/AuthLayout.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const FIELDS = [
  { id: 'name', label: 'Full name', type: 'text', placeholder: 'Jasmin Lowery' },
  { id: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
  { id: 'password', label: 'Password', type: 'password', placeholder: 'At least 6 characters' },
  { id: 'confirm', label: 'Confirm password', type: 'password', placeholder: 'Repeat your password' },
];

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

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It only takes a moment."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {FIELDS.map((field) => (
          <div key={field.id} data-auth-field>
            <label className="label" htmlFor={field.id}>
              {field.label}
            </label>
            <input
              id={field.id}
              type={field.type}
              required
              className="input"
              value={form[field.id]}
              placeholder={field.placeholder}
              onChange={(event) => setForm({ ...form, [field.id]: event.target.value })}
            />
          </div>
        ))}

        <div data-auth-field>
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Create account
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Register;
