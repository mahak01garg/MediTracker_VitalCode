// src/context/NotificationContext.jsx
import React, { createContext, useContext, useState } from "react";

// 1️⃣ Create context
const NotificationContext = createContext();

// 2️⃣ Custom hook for consuming context
export const useNotifications = () => {
  return useContext(NotificationContext);
};

// 3️⃣ Provider component
export const NotificationProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  //Add new alert
  const addAlert = (message, type = "info") => {
    const id = Date.now();
    setAlerts(prev => [...prev, { id, message, type }]);
  };
// NotificationContext.jsx
// const addAlert = (message, type = "success", duration = 3000) => {
//   const id = Date.now();
//   setNotifications((prev) => [...prev, { id, message, type }]);

//   // Remove after duration
//   setTimeout(() => {
//     setNotifications((prev) => prev.filter((n) => n.id !== id));
//   }, duration);
// };

  // Remove alert by id
  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ alerts, addAlert, removeAlert }}>
      {children}
    </NotificationContext.Provider>
  );
};
