// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import PropTypes from 'prop-types';
import { authApi } from './api';


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshTokenValue = localStorage.getItem("refreshToken");
  const handleAuthSuccess = useCallback((response) => {
    const { token } = response;
    localStorage.setItem('token', token);
    setToken(token);
    const decoded = jwtDecode(token);
    setUser(decoded);
    return response;
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authApi.login(credentials);
      return handleAuthSuccess(response);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  const handleRefreshToken = async (refreshToken) => {
    try {
      const response = await fetch("http://localhost:5000/api/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) throw new Error("Ошибка при обновлении токена");

      const data = await response.json();
      localStorage.setItem("token", data.accessToken); // или data.token
    } catch (error) {
      console.error("Ошибка обновления токена:", error);
    }
  };
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authApi.register(userData);
      const loginResponse = await authApi.login({
        email: userData.email,
        password: userData.password
      });
      return handleAuthSuccess(loginResponse);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    authApi.logout().catch(err => console.error('Logout error:', err));
  }, []);

  const updateProfile = async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authApi.updateProfile(data);
      return handleAuthSuccess(response);
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.error || err.message || 'Profile update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = useCallback(async () => {
    try {
      if (!token) return;
      const response = await authApi.refreshToken(token);
      handleAuthSuccess(response);
      return response;
    } catch (err) {
      console.error('Token refresh error:', err);
      logout();
      throw err;
    }
  }, [token, handleAuthSuccess, logout]);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        if (!token) {
          setLoading(false);
          return;
        }
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
          await refreshToken();
        } else {
          setUser(decoded);
        }
      } catch (err) {
        console.error('Token verification error:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token, refreshToken, logout]);

  const hasRole = (role) => user?.role === role;
  const hasPermission = (permission) => user?.permissions?.includes(permission);

  const contextValue = {
    token,
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    refreshToken,
    hasRole,
    hasPermission,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
