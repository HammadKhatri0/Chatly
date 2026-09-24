import { Outlet, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import Sidebar from './Sidebar.jsx';
import { useEnter } from '../../hooks/useMotion.js';

/**
 * Two-pane layout. On phones only one pane is visible at a time: the inbox on the
 * list routes, the active view everywhere else. The main pane eases in on each
 * route change so switching sections reads as a transition, not a repaint.
 */
const AppShell = () => {
  const { pathname } = useLocation();
  const listRoute = pathname === '/chats' || pathname === '/archive';
  // Chats keep their own transitions; animating per message id would fight them.
  const transitionKey = pathname.startsWith('/chats/') ? 'chat' : pathname;
  const mainRef = useEnter(transitionKey, { distance: 10 });

  return (
    <div className="flex h-full overflow-hidden bg-ink-50">
      <div className={clsx('h-full w-full md:w-auto', !listRoute && 'hidden md:block')}>
        <Sidebar />
      </div>
      <main
        ref={mainRef}
        className={clsx('flex h-full min-w-0 flex-1', listRoute && 'hidden md:flex')}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
