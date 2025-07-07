import React, { useContext } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
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
import { HomeOutlined, FormOutlined, UserOutlined, DashboardOutlined, LoginOutlined, LogoutOutlined } from '@ant-design/icons';
import './App.css';

function App() {
  const { token, user, logout } = useContext(AuthContext);
  const location = useLocation();

  const hasRole = (role) => user?.role === role;
  const isAdmin = hasRole('ADMIN');

  // Определяем активный путь для подсветки навигации
  const activePath = location.pathname;

  // Пропускаем навигацию на страницах аутентификации
  const showNavigation = !['/login', '/register'].includes(activePath);

  return (
    <div className="app-container">
      {/* Шапка приложения */}
      {showNavigation && (
        <header className="app-header">
          <div className="flex-between">
            <Link to="/" className="app-logo">
              <FormOutlined />
              <span>FormBuilder</span>
            </Link>

            <nav className="nav-menu">
              <ul className="nav-menu">
                <li className="nav-item">
                  <Link
                    to="/"
                    className={`nav-link ${activePath === '/' ? 'active' : ''}`}
                  >
                    <HomeOutlined />
                    <span>Home</span>
                  </Link>
                </li>

                {token && (
                  <>
                    <li className="nav-item">
                      <Link
                        to="/templates"
                        className={`nav-link ${activePath.startsWith('/templates') ? 'active' : ''}`}
                      >
                        <FormOutlined />
                        <span>My Templates</span>
                      </Link>
                    </li>

                    <li className="nav-item">
                      <Link
                        to="/my-forms"
                        className={`nav-link ${activePath.startsWith('/my-forms') ? 'active' : ''}`}
                      >
                        <FormOutlined />
                        <span>My Forms</span>
                      </Link>
                    </li>

                    <li className="nav-item">
                      <Link
                        to="/user"
                        className={`nav-link ${activePath.startsWith('/user') ? 'active' : ''}`}
                      >
                        <UserOutlined />
                        <span>Profile</span>
                      </Link>
                    </li>

                    {isAdmin && (
                      <li className="nav-item">
                        <Link
                          to="/admin"
                          className={`nav-link ${activePath.startsWith('/admin') ? 'active' : ''}`}
                        >
                          <DashboardOutlined />
                          <span>Admin</span>
                        </Link>
                      </li>
                    )}
                  </>
                )}
              </ul>
            </nav>

            <div className="auth-section">
              {token ? (
                <div className="user-info">
                  <span className="user-greeting">
                    Hello, <strong>{user?.name || user?.email}</strong>
                  </span>
                  <button
                    className="btn btn-outline"
                    onClick={logout}
                  >
                    <LogoutOutlined />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <Link to="/login" className="btn btn-primary">
                  <LoginOutlined />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Основное содержимое */}
      <main className="app-main">
        <div className="app-content">
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
            <Route
              path="/templates/create"
              element={token ? <CreateTemplateForm /> : <Navigate to="/login" replace />}
            />
            <Route path="/templates/:id" element={<TemplatePage />} />
            <Route path="/forms/create/:id" element={<FormCreatePage />} />
            <Route path="/forms/:id" element={<FormPage />} />
            <Route path="/user" element={token ? <UserPage /> : <Navigate to="/login" replace />} />
            <Route path="/my-forms" element={token ? <UserFormsPage /> : <Navigate to="/login" replace />} />
            <Route
              path="/admin"
              element={
                token && isAdmin ? (
                  <AdminPanel />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Резервный маршрут */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      {/* Подвал приложения */}
      {showNavigation && (
        <footer className="app-footer">
          <div className="container">
            <p>FormBuilder © {new Date().getFullYear()} - Create and share forms easily</p>
            <div className="footer-links">
              <Link to="/">Home</Link>
              <Link to="/templates">Templates</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
