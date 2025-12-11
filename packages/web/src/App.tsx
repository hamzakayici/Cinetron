import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Library from './pages/library/Library';
import Admin from './pages/admin/Admin';
import Setup from './pages/setup/Setup';
import Player from './pages/player/Player';
import api from './services/api';
import { Loader2 } from 'lucide-react';

// Guard to check if system is setup
const SetupGuard = ({ children }: { children: React.ReactNode }) => {
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await api.get('/system/setup-status');
        setIsSetup(res.data.isSetup);

        // If not setup and trying to access anything other than setup page
        if (!res.data.isSetup && !location.pathname.includes('/setup')) {
          navigate('/setup');
        }
        // If setup is done but trying to access setup page
        else if (res.data.isSetup && location.pathname.includes('/setup')) {
          navigate('/login');
        }
      } catch (err) {
        console.error("Failed to check setup status", err);
        // Fallback to allowing access if check fails (or handle error UI)
        setIsSetup(true);
      }
    };

    checkSetup();
  }, [navigate, location.pathname]);

  if (isSetup === null) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background text-white">
        <Loader2 className="animate-spin text-primary-500" size={48} />
      </div>
    );
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <BrowserRouter>
      <SetupGuard>
        <Routes>
          <Route path="/setup" element={<Setup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/watch/:id" element={<Player />} />

          <Route element={<Layout />}>
            {/* Protected Routes */}
            <Route path="/library" element={<Library />} />
            <Route path="/admin" element={<Admin />} />

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/library" replace />} />
          </Route>
        </Routes>
      </SetupGuard>
    </BrowserRouter>
  );
};

export default App;
