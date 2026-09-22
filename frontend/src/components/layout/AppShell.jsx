import { Outlet, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import Sidebar from './Sidebar.jsx';

/**
 * Two-pane layout. On phones only one pane is visible at a time: the inbox on the
 * list routes, the active view everywhere else.
 */
const AppShell = () => {
  const { pathname } = useLocation();
  const listRoute = pathname === '/chats' || pathname === '/archive';

  return (
    <div className="flex h-full overflow-hidden bg-ink-50">
      <div className={clsx('h-full w-full md:w-auto', !listRoute && 'hidden md:block')}>
        <Sidebar />
      </div>
      <main className={clsx('h-full min-w-0 flex-1', listRoute && 'hidden md:flex')}>
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
