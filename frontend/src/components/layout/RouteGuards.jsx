import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loading } from '../ui/Feedback.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export const RequireAuth = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading label="Signing you in…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
};

export const RequireAdmin = () => {
  const { isAdmin } = useAuth();
  return isAdmin ? <Outlet /> : <Navigate to="/chats" replace />;
};

export const RedirectIfAuthed = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return user ? <Navigate to="/chats" replace /> : children;
};
