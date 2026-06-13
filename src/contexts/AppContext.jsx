import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext({});

export const AppProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Apply theme class to body for global variable support
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const addNotification = (notif) => {
    setNotifications((prev) => [notif, ...prev]);
  };

  return (
    <AppContext.Provider value={{ isDarkMode, toggleDarkMode, notifications, addNotification }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
