import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { lightTheme, darkTheme } from '../theme/materialUI';

const IS_DARK_MODE_KEY = 'isDarkMode';

type ThemeContextType = {
  toggleTheme: () => void;
  isDarkMode: boolean;
};

export const ThemeContext = createContext<ThemeContextType>({
  toggleTheme: () => {},
  isDarkMode: false,
});

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedMode = localStorage.getItem(IS_DARK_MODE_KEY);
    return savedMode === 'true';
  });

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => {
      const newMode = !prevMode;
      localStorage.setItem(IS_DARK_MODE_KEY, String(newMode));
      return newMode;
    });
  };

  useEffect(() => {
    const savedMode = localStorage.getItem(IS_DARK_MODE_KEY);
    if (savedMode !== null) {
      setIsDarkMode(savedMode === 'true');
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ toggleTheme, isDarkMode }}>
      <MuiThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
