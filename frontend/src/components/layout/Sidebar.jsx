// import React, { useState } from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import { 
//     FiHome, 
//     FiCalendar,
//     FiMessageSquare,
//     FiUser,
//     FiSettings,
//     FiHelpCircle,
//     FiChevronLeft,
//     FiChevronRight,
//     FiBell,
//     FiTrendingUp
// } from 'react-icons/fi';
// import { BsRobot } from 'react-icons/bs';
// import { FaPills } from 'react-icons/fa'; // <-- Corrected import
// import { useAuth } from '../../context/AuthContext';

// const Sidebar = () => {
//     const { user } = useAuth();
//     const location = useLocation();
//     const [collapsed, setCollapsed] = useState(false);
//     const [activeSubmenu, setActiveSubmenu] = useState(null);

//     const mainMenuItems = [
//         {
//             id: 'dashboard',
//             label: 'Dashboard',
//             icon: <FiHome className="w-5 h-5" />,
//             path: '/',
//             badge: null
//         },
//         {
//             id: 'medications',
//             label: 'Medications',
//             icon: <FaPills className="w-5 h-5" />, // <-- Corrected usage
//             path: '/medications',
//             badge: null
//         },
//         {
//             id: 'schedule',
//             label: 'Schedule',
//             icon: <FiCalendar className="w-5 h-5" />,
//             path: '/schedule',
//            // badge: '3'
//         },
//         {
//             id: 'ai-assistant',
//             label: 'AI Assistant',
//             icon: <BsRobot className="w-5 h-5" />,
//             path: '/chatbot',
//             badge: null
//         },
//         {
//             id: 'analytics',
//             label: 'Analytics',
//             icon: <FiTrendingUp className="w-5 h-5" />,
//             path: '/analytics',
//             badge: null
//         },
//     ];

//     const secondaryMenuItems = [
//         {
//             id: 'profile',
//             label: 'Profile',
//             icon: <FiUser className="w-5 h-5" />,
//             path: '/profile'
//         },
//         {
//             id: 'settings',
//             label: 'Settings',
//             icon: <FiSettings className="w-5 h-5" />,
//             path: '/settings'
//         },
//         {
//             id: 'help',
//             label: 'Help & Support',
//             icon: <FiHelpCircle className="w-5 h-5" />,
//             path: '/support'
//         }
//     ];

//     const isActive = (path) => location.pathname === path;

//     const toggleSubmenu = (menuId) => {
//         setActiveSubmenu(activeSubmenu === menuId ? null : menuId);
//     };

//     return (
//         <aside className={`h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} sticky top-0 flex flex-col`}>
//             {/* Logo */}
//             <div className={`p-6 border-b border-gray-700 ${collapsed ? 'flex justify-center' : ''}`}>
//                 {collapsed ? (
//                     <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
//                         <FaPills className="w-6 h-6" /> {/* <-- Corrected */}
//                     </div>
//                 ) : (
//                     <div className="flex items-center space-x-3">
//                         <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
//                             <FaPills className="w-6 h-6" /> {/* <-- Corrected */}
//                         </div>
//                         <div>
//                             <h1 className="text-xl font-bold">MediTracker</h1>
//                             <p className="text-xs text-gray-400">Health Companion</p>
//                         </div>
//                     </div>
//                 )}
//             </div>

//             {/* Toggle Button */}
//             <div className="p-4 border-b border-gray-700">
//                 <button
//                     onClick={() => setCollapsed(!collapsed)}
//                     className="w-full flex items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
//                 >
//                     {collapsed ? (
//                         <FiChevronRight className="w-5 h-5" />
//                     ) : (
//                         <>
//                             <FiChevronLeft className="w-5 h-5" />
//                             <span className="ml-2 text-sm">Collapse</span>
//                         </>
//                     )}
//                 </button>
//             </div>

//             {/* User Profile */}
//             {!collapsed && user && (
//                 <div className="p-4 border-b border-gray-700">
//                     <div className="flex items-center space-x-3">
//                         <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
//                             <span className="font-bold">{user.name?.charAt(0).toUpperCase() || 'U'}</span>
//                         </div>
//                         <div className="flex-1">
//                             <p className="font-medium text-sm">{user.name || 'User'}</p>
//                             <p className="text-xs text-gray-400 truncate">{user.email || 'user@example.com'}</p>
//                         </div>
//                         {/* <button className="relative p-1">
//                             <FiBell className="w-5 h-5" />
//                             <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
//                                 3
//                             </span>
//                         </button> */}
//                     </div>
//                 </div>
//             )}

//             {/* Main Menu */}
//             <nav className="flex-1 p-4 overflow-y-auto">
//                 <div className="space-y-1">
//                     <p className={`text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ${collapsed ? 'text-center' : ''}`}>
//                         {collapsed ? '...' : 'Main Menu'}
//                     </p>
//                     {mainMenuItems.map((item) => (
//                         <Link
//                             key={item.id}
//                             to={item.path}
//                             className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-3 rounded-lg transition-all duration-200 group ${isActive(item.path)
//                                     ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
//                                     : 'hover:bg-gray-700 text-gray-300 hover:text-white'
//                                 }`}
//                         >
//                             <div className="flex items-center">
//                                 <div className={`${isActive(item.path) ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
//                                     {item.icon}
//                                 </div>
//                                 {!collapsed && <span className="ml-3 font-medium">{item.label}</span>}
//                             </div>
//                             {!collapsed && item.badge && (
//                                 <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
//                                     {item.badge}
//                                 </span>
//                             )}
//                         </Link>
//                     ))}
//                 </div>

//                 {/* Secondary Menu */}
//                 <div className="mt-8 space-y-1">
//                     <p className={`text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ${collapsed ? 'text-center' : ''}`}>
//                         {collapsed ? '...' : 'Account'}
//                     </p>
//                     {secondaryMenuItems.map((item) => (
//                         <Link
//                             key={item.id}
//                             to={item.path}
//                             className={`flex items-center p-3 rounded-lg transition-colors ${collapsed ? 'justify-center' : ''} ${isActive(item.path)
//                                     ? 'bg-gray-700 text-white'
//                                     : 'hover:bg-gray-700 text-gray-300 hover:text-white'
//                                 }`}
//                         >
//                             <div className={`${isActive(item.path) ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
//                                 {item.icon}
//                             </div>
//                             {!collapsed && <span className="ml-3 font-medium">{item.label}</span>}
//                         </Link>
//                     ))}
//                 </div>
//             </nav>

//             {/* Footer */}
//             <div className={`p-4 border-t border-gray-700 ${collapsed ? 'text-center' : ''}`}>
//                 {collapsed ? (
//                     <div className="text-gray-400">
//                         <FiHelpCircle className="w-5 h-5 mx-auto" />
//                     </div>
//                 ) : (
//                     <div className="flex items-center justify-between">
//                         <div className="text-xs text-gray-400">
//                             <p>Version 1.0.0</p>
//                             <p>© 2024 MediTracker</p>
//                         </div>
//                         <button className="text-gray-400 hover:text-white">
//                             <FiHelpCircle className="w-5 h-5" />
//                         </button>
//                     </div>
//                 )}
//             </div>
//         </aside>
//     );
// };

// export default Sidebar;

import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    FiHome, 
    FiCalendar,
    FiMapPin,
    FiTruck,
    FiUser,
    FiSettings,
    FiHelpCircle,
    FiChevronLeft,
    FiChevronRight,
    FiBell,
    FiTrendingUp
} from 'react-icons/fi';
import { BsRobot } from 'react-icons/bs';
import { FaPills } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [avatarImageFailed, setAvatarImageFailed] = useState(false);
    const avatarLetter = (user?.name || user?.email || 'U').charAt(0).toUpperCase();

    useEffect(() => {
        setAvatarImageFailed(false);
    }, [user?.profilePicture]);

    const isDoctor = user?.role === 'doctor';
    const roleLabel = isDoctor ? 'Doctor' : 'Patient';

    const mainMenuItems = [
        { id: 'ai-assistant', label: 'AI Assistant', icon: <BsRobot className="w-5 h-5" />, path: '/chatbot' },
        { id: 'appointments', label: 'Appointments', icon: <FiCalendar className="w-5 h-5" />, path: '/appointments' },
        { id: 'ambulance', label: 'Ambulance', icon: <FiTruck className="w-5 h-5" />, path: '/ambulance-booking' },
        { id: 'nearby-hospitals', label: 'Nearby Hospitals', icon: <FiMapPin className="w-5 h-5" />, path: '/nearby-hospitals' },
    ];
    const patientMenuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <FiHome className="w-5 h-5" />, path: '/dashboard' },
        { id: 'medications', label: 'Medications', icon: <FaPills className="w-5 h-5" />, path: '/medications' },
        { id: 'schedule', label: 'Schedule', icon: <FiCalendar className="w-5 h-5" />, path: '/schedule' },
        { id: 'analytics', label: 'Analytics', icon: <FiTrendingUp className="w-5 h-5" />, path: '/analytics' },
    ];
    const visibleMainMenuItems = isDoctor ? mainMenuItems : [...patientMenuItems, ...mainMenuItems];

    const secondaryMenuItems = [
        { id: 'profile', label: 'Profile', icon: <FiUser className="w-5 h-5" />, path: '/profile' },
        { id: 'settings', label: 'Settings', icon: <FiSettings className="w-5 h-5" />, path: '/settings' },
        { id: 'help', label: 'Help & Support', icon: <FiHelpCircle className="w-5 h-5" />, path: '/support' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <aside className={`h-screen ${collapsed ? 'w-20' : 'w-64'} sticky top-0 flex flex-col transition-all duration-300
            bg-white text-slate-900 border-r border-slate-200 dark:bg-slate-900 dark:text-white dark:border-slate-800`}>
            
            {/* Logo */}
            <div className={`p-6 border-b border-slate-200 dark:border-slate-800 ${collapsed ? 'flex justify-center' : 'flex items-center space-x-3'}`}>
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-xl shadow-md shadow-blue-900/40">
                    <FaPills className="w-6 h-6 text-white" />
                </div>
                {!collapsed && (
                    <div>
                        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">MediTracker</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Health Companion</p>
                    </div>
                )}
            </div>

            {/* Toggle Button */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full flex items-center justify-center p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-700 dark:text-slate-200"
                >
                    {collapsed ? <FiChevronRight className="w-5 h-5" /> : (
                        <>
                            <FiChevronLeft className="w-5 h-5" />
                            <span className="ml-2 text-sm">Collapse</span>
                        </>
                    )}
                </button>
            </div>

            {/* User Profile */}
            {collapsed && user && (
                <div className="flex justify-center p-4 border-b border-slate-200 dark:border-slate-800">
                    <Link
                        to="/profile"
                        className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-md shadow-blue-900/30"
                        title={user.name || 'Profile'}
                        aria-label="Open profile"
                    >
                        {user.profilePicture && !avatarImageFailed ? (
                            <img
                                src={user.profilePicture}
                                alt={user.name || 'Profile'}
                                className="h-full w-full object-cover"
                                onError={() => setAvatarImageFailed(true)}
                            />
                        ) : (
                            avatarLetter
                        )}
                    </Link>
                </div>
            )}

            {!collapsed && user && (
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            {user.profilePicture && !avatarImageFailed ? (
                                <img
                                    src={user.profilePicture}
                                    alt={user.name || 'Profile'}
                                    className="h-full w-full object-cover"
                                    onError={() => setAvatarImageFailed(true)}
                                />
                            ) : (
                                <span className="font-bold text-white">{avatarLetter}</span>
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-slate-900 dark:text-white">{user.name || 'User'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email || 'user@example.com'}</p>
                            <p className="mt-1 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                {roleLabel}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Menu */}
            <nav className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-1">
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-2 text-slate-500 ${collapsed ? 'text-center' : ''}`}>
                        {collapsed ? '...' : 'Main Menu'}
                    </p>
                    {visibleMainMenuItems.map(item => (
                        <Link
                            key={item.id}
                            to={item.path}
                            className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-3 rounded-xl transition-all duration-200
                                ${isActive(item.path) ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/40' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            <div className="flex items-center">
                                <div className={`${isActive(item.path) ? 'text-white' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white'}`}>
                                    {item.icon}
                                </div>
                                {!collapsed && <span className="ml-3 font-medium">{item.label}</span>}
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Secondary Menu */}
                <div className="mt-8 space-y-1">
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-2 text-slate-500 ${collapsed ? 'text-center' : ''}`}>
                        {collapsed ? '...' : 'Account'}
                    </p>
                    {secondaryMenuItems.map(item => (
                        <Link
                            key={item.id}
                            to={item.path}
                            className={`flex items-center p-3 rounded-xl transition-colors ${collapsed ? 'justify-center' : ''} 
                                ${isActive(item.path) ? 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            <div className={`${isActive(item.path) ? 'text-slate-900 dark:text-white' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white'}`}>
                                {item.icon}
                            </div>
                            {!collapsed && <span className="ml-3 font-medium">{item.label}</span>}
                        </Link>
                    ))}
                </div>
            </nav>

            {/* Footer */}
            <div className={`p-4 border-t border-slate-200 dark:border-slate-800 ${collapsed ? 'text-center' : ''}`}>
                {collapsed ? (
                    <div className="text-slate-500 dark:text-gray-400">
                        <FiHelpCircle className="w-5 h-5 mx-auto" />
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                            <p>Version 1.0.0</p>
                            <p>© 2024 MediTracker</p>
                        </div>
                        <button className="text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white">
                            <FiHelpCircle className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;

