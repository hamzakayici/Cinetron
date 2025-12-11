import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Library from './pages/library/Library';
import Admin from './pages/admin/Admin';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<Layout />}>
          {/* Protected Routes */}
          <Route path="/library" element={<Library />} />
          <Route path="/admin" element={<Admin />} />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/library" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
