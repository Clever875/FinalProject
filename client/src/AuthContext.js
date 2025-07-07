// src/AuthContext.js
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode'; // Правильный импорт именованного экспорта
import { authApi } from './api';

export const AuthContext = createContext(); // Экспорт контекста

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Функция для входа пользователя
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authApi.login(credentials);
      localStorage.setItem('token', response.token);
      setToken(response.token);

      const decoded = jwtDecode(response.token); // Исправленное использование
      setUser(decoded);

      return response;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Функция для регистрации пользователя
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authApi.register(userData);
      return response;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Функция для выхода пользователя
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    authApi.logout();
  }, []);

  // Функция для обновления профиля пользователя
  const updateProfile = async (data) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authApi.updateProfile(data);
      const decoded = jwtDecode(response.token); // Исправлено
      setUser(decoded);
      setToken(response.token);
      localStorage.setItem('token', response.token);

      return response;
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message || 'Profile update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Проверка аутентификации при загрузке приложения
  useEffect(() => {
    const verifyToken = async () => {
      try {
        if (token) {
          const decoded = jwtDecode(token); // Исправлено

          // Проверка срока действия токена
          const currentTime = Date.now() / 1000;
          if (decoded.exp < currentTime) {
            // Попытка обновить токен
            const response = await authApi.refreshToken(token);
            localStorage.setItem('token', response.token);
            setToken(response.token);

            const newDecoded = jwtDecode(response.token); // Исправлено
            setUser(newDecoded);
          } else {
            setUser(decoded);
          }
        }
      } catch (err) {
        console.error('Token verification error:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyToken();

    // Очистка при размонтировании
    return () => {
      setLoading(false);
    };
  }, [token, logout]);

  // Проверка ролей пользователя
  const hasRole = (role) => {
    return user?.role === role;
  };

  const contextValue = {
    token,
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    hasRole,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
