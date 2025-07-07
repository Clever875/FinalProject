import React, { createContext, useState, useEffect, useContext } from 'react';

// Создаем контекст темы
const ThemeContext = createContext();

// Провайдер темы
export const ThemeProvider = ({ children }) => {
  // Получаем начальную тему из localStorage или системных настроек
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    return savedTheme || (prefersDark ? 'dark' : 'light');
  };

  const [theme, setTheme] = useState(getInitialTheme());
  const [darkMode, setDarkMode] = useState(theme === 'dark');

  // Применяем тему к документу
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    setDarkMode(theme === 'dark');
  }, [theme]);

  // Переключение темы
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Значение контекста
  const contextValue = {
    theme,
    darkMode,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Хук для использования темы
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
