import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
    const context = useContext(AuthContext);
    
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    
    return context;
};

// Extended auth hook with additional functionality
export const useAuthActions = () => {
    const { login, register, logout, updateProfile } = useAuth();
    
    const loginWithEmail = async (email, password) => {
        return await login(email, password);
    };
    
    const registerWithEmail = async (userData) => {
        return await register(userData);
    };
    
    const logoutUser = () => {
        logout();
    };
    
    const updateUserProfile = async (profileData) => {
        return await updateProfile(profileData);
    };
    
    return {
        loginWithEmail,
        registerWithEmail,
        logoutUser,
        updateUserProfile
    };
};

// Hook for checking authentication status
export const useAuthStatus = () => {
    const { user, loading } = useAuth();
    
    return {
        isAuthenticated: !!user,
        isLoading: loading,
        user,
        isAdmin: user?.role === 'admin',
        isVerified: user?.isVerified || false
    };
};