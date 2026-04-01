
// import React, { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { useAuth } from "../../context/AuthContext";
// import { useTheme } from "../../context/ThemeContext";
// import { useNotifications } from "../../context/NotificationContext";
// import { FiHome, FiUser, FiLogOut, FiMenu, FiX, FiBell, FiSun, FiMoon } from "react-icons/fi";
// import { FaPills } from "react-icons/fa";
// import { BsRobot } from "react-icons/bs";

// const Navbar = () => {
//   const { user, logout } = useAuth();
//   const { darkMode, toggleTheme } = useTheme();
//   const { alerts } = useNotifications();
//   const navigate = useNavigate();

//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [showNotifications, setShowNotifications] = useState(false);

//   const handleLogout = () => {
//     logout();
//     navigate("/login");
//   };

//   const navLinks = [
//     { to: "/", label: "Dashboard" },
//     { to: "/medications", label: "Medications" },
//     { to: "/chatbot", label: "AI Assistant" },
//     { to: "/profile", label: "Profile" },
//   ];

//   return (
//     <nav className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between h-16 items-center">

//           {/* Logo */}
//           <Link to="/" className="flex items-center space-x-3">
//             <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
//               <FaPills className="w-6 h-6 text-white" />
//             </div>
//             <div>
//               <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
//                 MediTracker
//               </h1>
//             </div>
//           </Link>

//           {/* Desktop Nav */}
//           <div className="hidden md:flex items-center space-x-2">
//             {navLinks.map(link => (
//               <Link key={link.to} to={link.to} className="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
//                 {link.label}
//               </Link>
//             ))}

//             {/* Dark mode toggle */}
//             <button onClick={toggleTheme} className="p-2 rounded-lg">
//               {darkMode ? <FiSun className="text-yellow-400" /> : <FiMoon />}
//             </button>

//             {/* Notifications */}
//             <div className="relative">
//               <button
//                 onClick={() => setShowNotifications(!showNotifications)}
//                 className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 relative"
//               >
//                 <FiBell className="w-5 h-5" />
//                 {alerts.length > 0 && (
//                   <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs h-4 w-4 rounded-full flex items-center justify-center">
//                     {alerts.length}
//                   </span>
//                 )}
//               </button>

//               {showNotifications && (
//                 <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden z-50">
//                   {alerts.length === 0 && <div className="px-4 py-2 text-gray-500 text-sm">No alerts</div>}
//                   {alerts.map(alert => (
//                     <div
//                       key={alert.id}
//                       className={`px-4 py-2 border-b last:border-0 text-sm ${
//                         alert.type === "success"
//                           ? "text-green-700 dark:text-green-400"
//                           : alert.type === "warning"
//                           ? "text-yellow-700 dark:text-yellow-400"
//                           : alert.type === "error"
//                           ? "text-red-700 dark:text-red-400"
//                           : "text-gray-700 dark:text-gray-300"
//                       }`}
//                     >
//                       {alert.message}
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {/* Logout */}
//             {user && (
//               <button onClick={handleLogout} className="ml-3 px-4 py-2 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-gray-800">
//                 Logout
//               </button>
//             )}
//           </div>

//           {/* Mobile Menu */}
//           <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 rounded-lg">
//             {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
//           </button>
//         </div>

//         {isMenuOpen && (
//           <div className="md:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-700">
//             {navLinks.map(link => (
//               <Link key={link.to} to={link.to} onClick={() => setIsMenuOpen(false)} className="block px-6 py-3">
//                 {link.label}
//               </Link>
//             ))}
//           </div>
//         )}
//       </div>
//     </nav>
//   );
// };

// export default Navbar;
// import React, { useState, useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { useAuth } from "../../context/AuthContext";
// import { useTheme } from "../../context/ThemeContext";
// import { useNotifications } from "../../context/NotificationContext";
// import { FiHome, FiUser, FiLogOut, FiMenu, FiX, FiBell, FiSun, FiMoon } from "react-icons/fi";
// import { FaPills } from "react-icons/fa";

// const Navbar = () => {
//   const { user, logout } = useAuth();
//   const { darkMode, toggleTheme } = useTheme();
//   const { alerts } = useNotifications();
//   const navigate = useNavigate();

//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [showNotifications, setShowNotifications] = useState(false);

//   const handleLogout = () => {
//     logout();
//     navigate("/login");
//   };

//   const navLinks = [
//     { to: "/", label: "Dashboard" },
//     { to: "/medications", label: "Medications" },
//     { to: "/chatbot", label: "AI Assistant" },
//     { to: "/profile", label: "Profile" },
//   ];

//   // ✅ Apply dark mode globally
//   useEffect(() => {
//     document.documentElement.classList.toggle("dark", darkMode);
//   }, [darkMode]);

//   return (
//     <nav className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between h-16 items-center">

//           {/* Logo */}
//           <Link to="/" className="flex items-center space-x-3">
//             <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
//               <FaPills className="w-6 h-6 text-white" />
//             </div>
//             <div>
//               <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
//                 MediTracker
//               </h1>
//               <p className="text-xs text-gray-500 dark:text-gray-400">
//                 Your Health Companion
//               </p>
//             </div>
//           </Link>

//           {/* Desktop Nav */}
//           <div className="hidden md:flex items-center space-x-2">
//             {navLinks.map(link => (
//               <Link
//                 key={link.to}
//                 to={link.to}
//                 className="flex items-center px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
//               >
//                 {link.label}
//               </Link>
//             ))}

//             {/* Dark mode toggle */}
//             <button
//               onClick={toggleTheme}
//               className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
//             >
//               {darkMode ? <FiSun className="w-5 h-5 text-yellow-400" /> : <FiMoon className="w-5 h-5" />}
//             </button>

//             {/* Notifications */}
//             <div className="relative">
//               <button
//                 onClick={() => setShowNotifications(!showNotifications)}
//                 className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 relative"
//               >
//                 <FiBell className="w-5 h-5" />
//                 {alerts?.length > 0 && (
//                   <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs h-4 w-4 rounded-full flex items-center justify-center">
//                     {alerts.length}
//                   </span>
//                 )}
//               </button>

//               {showNotifications && (
//                 <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden z-50">
//                   {(!alerts || alerts.length === 0) && (
//                     <div className="px-4 py-2 text-gray-500 text-sm">No alerts</div>
//                   )}
//                   {alerts?.map(alert => (
//                     <div
//                       key={alert.id}
//                       className={`px-4 py-2 border-b last:border-0 text-sm ${
//                         alert.type === "success"
//                           ? "text-green-700 dark:text-green-400"
//                           : alert.type === "warning"
//                           ? "text-yellow-700 dark:text-yellow-400"
//                           : alert.type === "error"
//                           ? "text-red-700 dark:text-red-400"
//                           : "text-gray-700 dark:text-gray-300"
//                       }`}
//                     >
//                       {alert.message}
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {/* Logout */}
//             {user && (
//               <button
//                 onClick={handleLogout}
//                 className="ml-3 px-4 py-2 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-gray-800 transition"
//               >
//                 Logout
//               </button>
//             )}
//           </div>

//           {/* Mobile Menu */}
//           <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 rounded-lg">
//             {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
//           </button>
//         </div>

//         {isMenuOpen && (
//           <div className="md:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-700">
//             {navLinks.map(link => (
//               <Link
//                 key={link.to}
//                 to={link.to}
//                 onClick={() => setIsMenuOpen(false)}
//                 className="block px-6 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
//               >
//                 {link.label}
//               </Link>
//             ))}
//           </div>
//         )}
//       </div>
//     </nav>
//   );
// };

// export default Navbar;
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useNotifications } from "../../context/NotificationContext";
import { BsRobot } from "react-icons/bs";
import { FiActivity, FiBell, FiCalendar, FiHome, FiMapPin, FiMenu, FiMoon, FiSun, FiTruck, FiX } from "react-icons/fi";
import { FaPills } from "react-icons/fa";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const { alerts, removeAlert } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [avatarImageFailed, setAvatarImageFailed] = useState(false);
  const isDoctor = user?.role === "doctor";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const sharedNavItems = [
    { to: "/chatbot", label: "AI Assistant", icon: BsRobot },
    { to: "/appointments", label: "Appointments", icon: FiCalendar },
    { to: "/ambulance-booking", label: "Ambulance", icon: FiTruck },
    { to: "/nearby-hospitals", label: "Nearby Hospitals", icon: FiMapPin },
  ];

  const patientNavItems = [
    { to: "/dashboard", label: "Dashboard", icon: FiHome },
    { to: "/medications", label: "Medications", icon: FaPills },
    { to: "/schedule", label: "Schedule", icon: FiCalendar },
    { to: "/analytics", label: "Analytics", icon: FiActivity },
  ];

  const navItems = isDoctor ? sharedNavItems : [...patientNavItems, ...sharedNavItems];

  const avatarLetter = (user?.name || user?.email || "U").charAt(0).toUpperCase();

  useEffect(() => {
    setAvatarImageFailed(false);
  }, [user?.profilePicture]);

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-xl shadow-md shadow-blue-500/20">
              <FaPills className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
                MediTracker
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Your Health Companion
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  aria-label={item.label}
                  className={`p-2.5 rounded-xl transition ${
                    isActive
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              );
            })}

            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {darkMode ? <FiSun className="w-5 h-5 text-yellow-400" /> : <FiMoon className="w-5 h-5 text-gray-700 dark:text-gray-200" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition"
              >
                <FiBell className="w-5 h-5" />
                {alerts?.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs h-4 w-4 rounded-full flex items-center justify-center">
                    {alerts.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden z-50">
                  {(!alerts || alerts.length === 0) && (
                    <div className="px-4 py-2 text-gray-500 dark:text-gray-400 text-sm">No alerts</div>
                  )}
                  {alerts?.map(alert => (
                    <div
                      key={alert.id}
                      className={`px-4 py-2 border-b last:border-0 text-sm flex items-start justify-between gap-3 ${
                        alert.type === "success"
                          ? "text-green-700 dark:text-green-400"
                          : alert.type === "warning"
                          ? "text-yellow-700 dark:text-yellow-400"
                          : alert.type === "error"
                          ? "text-red-700 dark:text-red-400"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <span className="flex-1">{alert.message}</span>
                      <button
                        onClick={() => removeAlert(alert.id)}
                        className="rounded p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition"
                        aria-label="Remove notification"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Logout */}
            {user && (
              <>
                <Link
                  to="/profile"
                  className="ml-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-left shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
                    {user.profilePicture && !avatarImageFailed ? (
                      <img
                        src={user.profilePicture}
                        alt={user.name || "Profile"}
                        className="h-full w-full object-cover"
                        onError={() => setAvatarImageFailed(true)}
                      />
                    ) : (
                      avatarLetter
                    )}
                  </div>
                  <div className="max-w-28">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {user.name || "Profile"}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-300">
                      View profile
                    </p>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="ml-2 px-4 py-2 text-sm font-semibold text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-slate-800 transition"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-700">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsMenuOpen(false)}
                className="block px-6 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
