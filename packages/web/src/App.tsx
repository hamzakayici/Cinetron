import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Library from './pages/library/Library';

function App() {
  const isAuthenticated = false; // TODO: Check auth state

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={isAuthenticated ? <Navigate to="/library" /> : <Navigate to="/login" />} />
          <Route path="library" element={<Library />} />
          <Route path="admin" element={<div>Admin Dashboard</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
