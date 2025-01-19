import React, { createContext, useContext, useEffect, useState } from 'react';

// Define the type for your context
interface DarkModeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

// Create the context
const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

// Create a provider component
export const DarkModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const darkMode = localStorage.getItem('dark-mode') === 'true' ||
      (!('dark-mode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
    setIsDarkMode(darkMode);
    updateDarkMode(darkMode);
  }, []);

  const updateDarkMode = (darkMode: boolean) => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      updateDarkMode(newMode);
      localStorage.setItem('dark-mode', newMode.toString());
      return newMode;
    });
  };

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

// Create a custom hook for easy access to the context
export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};
