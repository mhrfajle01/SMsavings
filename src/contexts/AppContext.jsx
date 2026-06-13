import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext({});

export const AppProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const addNotification = (notif) => {
    setNotifications((prev) => [notif, ...prev]);
  };

  return (
    <AppContext.Provider value={{ isDarkMode, toggleDarkMode, notifications, addNotification }}>
      <div className={isDarkMode ? 'dark-mode' : 'light-mode'}>
        {children}
      </div>
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
