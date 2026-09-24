import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppShell from './components/layout/AppShell.jsx';
import { RedirectIfAuthed, RequireAdmin, RequireAuth } from './components/layout/RouteGuards.jsx';
import { ChatProvider } from './context/ChatContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Chat from './pages/Chat.jsx';
import Friends from './pages/Friends.jsx';
import Profile from './pages/Profile.jsx';
import Admin from './pages/Admin.jsx';

const App = () => (
  <>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        className:
          '!bg-panel !text-ink-800 !border !border-ink-100 !shadow-card !rounded-xl !text-sm',
      }}
    />
    <Routes>
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <Login />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/register"
        element={
          <RedirectIfAuthed>
            <Register />
          </RedirectIfAuthed>
        }
      />

      <Route element={<RequireAuth />}>
        <Route
          element={
            <SocketProvider>
              <ChatProvider>
                <AppShell />
              </ChatProvider>
            </SocketProvider>
          }
        >
          <Route path="/chats" element={<Chat />} />
          <Route path="/chats/:id" element={<Chat />} />
          <Route path="/archive" element={<Chat />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/profile" element={<Profile />} />
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/chats" replace />} />
    </Routes>
  </>
);

export default App;
