import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authApi } from './api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    token: localStorage.getItem('token') || null,
    user: null,
    loading: true,
    error: null
  });

  // Проверка токена при загрузке приложения
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setAuthState(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        // Проверяем валидность токена
        const decoded = jwtDecode(token);

        // Проверяем срок действия токена
        if (decoded.exp * 1000 < Date.now()) {
          throw new Error('Token expired');
        }

        // Проверяем токен на сервере
        const userData = await authApi.getMe();
        setAuthState({
          token,
          user: userData,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Authentication initialization error:', error);
        localStorage.removeItem('token');
        setAuthState({
          token: null,
          user: null,
          loading: false,
          error: 'Session expired. Please log in again.'
        });
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Получаем полный ответ сервера
      const response = await authApi.login({ email, password });

      localStorage.setItem('token', response.token);
      setAuthState({
        token: response.token,
        user: response.user, // Используем данные с сервера
        loading: false,
        error: null
      });

      return true;
    } catch (error) {
      console.error('Login error:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Login failed. Please check your credentials.'
      }));
      return false;
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await authApi.register({ name, email, password });

      // Автоматический вход после регистрации
      const success = await login(email, password);
      return success;
    } catch (error) {
      console.error('Registration error:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Registration failed. Please try again.'
      }));
      return false;
    }
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setAuthState({
      token: null,
      user: null,
      loading: false,
      error: null
    });

    // Опционально: вызов API для серверного логаута
    try {
      authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!authState.token) return;

    try {
      const userData = await authApi.getMe();
      setAuthState(prev => ({
        ...prev,
        user: userData
      }));
      return userData;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      logout();
      return null;
    }
  }, [authState.token, logout]);

  const value = {
    ...authState,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!authState.token,
    isAdmin: authState.user?.role === 'ADMIN'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Кастомный хук для удобного доступа к контексту
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
