import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../api/auth';

const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = new URL(API_URL).origin;

export const useAuth = () => useContext(AuthContext);

const normalizeProfilePicture = (profilePicture) => {
    if (!profilePicture) return '';
    const normalizedValue = String(profilePicture).trim();

    if (/^https?:\/\//i.test(normalizedValue)) {
        try {
            const parsedUrl = new URL(normalizedValue);
            if (parsedUrl.pathname.startsWith('/uploads/')) {
                return `${API_ORIGIN}${parsedUrl.pathname}`;
            }
            return normalizedValue;
        } catch {
            return normalizedValue;
        }
    }

    const uploadsPath = normalizedValue.startsWith('/uploads/')
        ? normalizedValue
        : `/uploads/${normalizedValue.split('/').pop()}`;

    return `${API_ORIGIN}${uploadsPath}`;
};

const normalizeUser = (user) => {
    if (!user) return user;
    const role = String(user.role || 'patient').toLowerCase();
    return {
        ...user,
        role,
        id: user.id || user._id,
        _id: user._id || user.id,
        profilePicture: normalizeProfilePicture(user.profilePicture)
    };
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (token && storedUser) {
            try {
                const userData = normalizeUser(JSON.parse(storedUser));
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));

                // Verify token is still valid
                const profileData = await authAPI.getProfile();
                if (profileData?.user) {
                    const normalizedUser = normalizeUser(profileData.user);
                    setUser(normalizedUser);
                    localStorage.setItem('user', JSON.stringify(normalizedUser));
                }
            } catch (err) {
                // Token is invalid, clear storage
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
            }
        }
        setLoading(false);
    };

    const login = async (email, password, role = 'patient') => {
        setError('');
        try {
            const data = await authAPI.login({ email, password, role });
            const normalizedUser = normalizeUser(data.user);
            setUser(normalizedUser);
            localStorage.setItem('user', JSON.stringify(normalizedUser));
            return { success: true, data };
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Login failed. Please check your credentials.';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        }
    };

    const register = async (userData) => {
    setError('');
    try {
        const res = await authAPI.register(userData);

        // ✅ SAVE TOKEN
        localStorage.setItem('token', res.token);

        // ✅ SET USER STATE
        const normalizedUser = normalizeUser(res.user);
        setUser(normalizedUser);
        localStorage.setItem('user', JSON.stringify(normalizedUser));

        return { success: true };
    } catch (err) {
        const errorMsg =
            err.response?.data?.error || 'Registration failed. Please try again.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
    }
};


    const logout = () => {
        authAPI.logout();
        setUser(null);
        setError('');
        window.location.href = '/login';
    };

    const updateProfile = async (userData) => {
        try {
            const data = await authAPI.updateProfile(userData);
            const normalizedUser = normalizeUser(data.user);
            setUser(normalizedUser);
            localStorage.setItem('user', JSON.stringify(normalizedUser));
            return { success: true, data: { ...data, user: normalizedUser } };
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Update failed';
            return { success: false, error: errorMsg };
        }
    };

    const value = {
        user,
        login,
        register,
        setUser,
        logout,
        updateProfile,
        loading,
        error,
        setError,
        isDoctor: user?.role === 'doctor',
        isPatient: !user || user?.role === 'patient'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
