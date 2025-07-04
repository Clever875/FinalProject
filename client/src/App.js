import React, { useContext } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import AdminPanel from './pages/AdminPanel';
import CreateTemplateForm from './pages/CreateTemplateForm';
import FormCreatePage from './pages/FormCreatePage';
import FormPage from './pages/FormPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TemplatePage from './pages/TemplatePage';
import TemplatesPage from './pages/TemplatesPage';
import UserFormsPage from './pages/UserFormsPage';
import UserPage from './pages/UserPage';
import { AuthContext } from './AuthContext';

function App() {
  const { token, user, logout } = useContext(AuthContext);

  const hasRole = (role) => user?.role === role;
  return (
    <div className="container mt-4">
      <nav className="mb-4 d-flex align-items-center gap-3">
        <Link to="/" className="me-3">Home</Link>

        {token ? (
          <>
            <Link to="/templates" className="me-3">My Templates</Link>
            {hasRole('admin') && <Link to="/admin" className="me-3">Admin Panel</Link>}
            <button
              className="btn btn-sm btn-outline-secondary me-3"
              onClick={logout}
              aria-label="Logout"
            >
              Logout
            </button>

            <span className="text-muted">Hello, {user?.name || user?.email}</span>
          </>
        ) : (
          <>
            <Link to="/login" className="me-3">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={token ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={token ? <Navigate to="/" replace /> : <RegisterPage />}
        />
        <Route
          path="/templates"
          element={token ? <TemplatesPage /> : <Navigate to="/login" replace />}
        />
        <Route path="/templates/:id" element={<TemplatePage />} />
        <Route path="/forms/create/:id" element={<FormCreatePage />} />
        <Route path="/forms/:id" element={<FormPage />} />
        <Route path="/user" element={token ? <UserPage /> : <Navigate to="/login" replace />} />
        <Route path="/templates/create" element={token ? <CreateTemplateForm /> : <Navigate to="/login" replace />} />
        <Route path="/my-forms" element={token ? <UserFormsPage /> : <Navigate to="/login" replace />} />
        <Route
          path="/admin"
          element={
            token && hasRole('admin') ? (
              <AdminPanel />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </div>
  );
}

export default App;
