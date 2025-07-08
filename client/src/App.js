import React, { useContext } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HomeOutlined,
  FormOutlined,
  UserOutlined,
  DashboardOutlined,
  LoginOutlined,
  LogoutOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { Dropdown, Button, Space, Menu } from 'antd';
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
import './App.css';

function App() {
  const { t, i18n } = useTranslation();
  const { token, user, logout } = useContext(AuthContext);
  const location = useLocation();

  const hasRole = (role) => user?.role === role;
  const isAdmin = hasRole('ADMIN');

  // Пропускаем навигацию на страницах аутентификации
  const showNavigation = !['/login', '/register'].includes(location.pathname);

  // Смена языка
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  // Меню выбора языка
  const languageMenu = (
    <Menu
      items={[
        { key: 'en', label: 'English', onClick: () => changeLanguage('en') },
        { key: 'ru', label: 'Русский', onClick: () => changeLanguage('ru') },
      ]}
    />
  );

  return (
    <div className="app-container">
      {/* Шапка приложения */}
      {showNavigation && (
        <header className="app-header">
          <div className="header-content">
            <Link to="/" className="app-logo">
              <FormOutlined />
              <span>FormBuilder</span>
            </Link>

            <nav className="nav-menu">
              <ul className="nav-items">
                <li className="nav-item">
                  <Link
                    to="/"
                    className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                  >
                    <HomeOutlined />
                    <span>{t('header.home')}</span>
                  </Link>
                </li>

                {token && (
                  <>
                    <li className="nav-item">
                      <Link
                        to="/templates"
                        className={`nav-link ${location.pathname.startsWith('/templates') ? 'active' : ''}`}
                      >
                        <FormOutlined />
                        <span>{t('header.templates')}</span>
                      </Link>
                    </li>

                    <li className="nav-item">
                      <Link
                        to="/my-forms"
                        className={`nav-link ${location.pathname.startsWith('/my-forms') ? 'active' : ''}`}
                      >
                        <FormOutlined />
                        <span>{t('header.myForms')}</span>
                      </Link>
                    </li>

                    {isAdmin && (
                      <li className="nav-item">
                        <Link
                          to="/admin"
                          className={`nav-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
                        >
                          <DashboardOutlined />
                          <span>{t('header.admin')}</span>
                        </Link>
                      </li>
                    )}
                  </>
                )}
              </ul>
            </nav>

            <div className="header-actions">
              <Dropdown overlay={languageMenu} placement="bottomRight">
                <Button type="text" icon={<GlobalOutlined />} />
              </Dropdown>

              {token ? (
                <Space className="user-section">
                  <Link
                    to="/user"
                    className={`user-profile ${location.pathname.startsWith('/user') ? 'active' : ''}`}
                  >
                    <UserOutlined />
                    <span>{user?.name || user?.email}</span>
                  </Link>
                  <Button
                    type="text"
                    icon={<LogoutOutlined />}
                    onClick={logout}
                    className="logout-btn"
                  >
                    {t('header.logout')}
                  </Button>
                </Space>
              ) : (
                <Link to="/login" className="login-btn">
                  <LoginOutlined />
                  <span>{t('header.login')}</span>
                </Link>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Основное содержимое */}
      <main className="app-main">
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
              token && isAdmin ? <AdminPanel /> : <Navigate to="/login" replace />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Подвал приложения */}
      {showNavigation && (
        <footer className="app-footer">
          <div className="footer-content">
            <p>© {new Date().getFullYear()} FormBuilder. {t('footer.rights')}</p>
            <div className="footer-links">
              <Link to="/privacy">{t('footer.privacy')}</Link>
              <Link to="/terms">{t('footer.terms')}</Link>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
