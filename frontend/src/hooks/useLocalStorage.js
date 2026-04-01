import { useState, useEffect } from 'react';

export const useLocalStorage = (key, initialValue) => {
    // State to store our value
    // Pass initial state function to useState so logic is only executed once
    const [storedValue, setStoredValue] = useState(() => {
        try {
            // Get from local storage by key
            const item = window.localStorage.getItem(key);
            // Parse stored json or if none return initialValue
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            // If error also return initialValue
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // Return a wrapped version of useState's setter function that ...
    // ... persists the new value to localStorage.
    const setValue = (value) => {
        try {
            // Allow value to be a function so we have same API as useState
            const valueToStore =
                value instanceof Function ? value(storedValue) : value;
            // Save state
            setStoredValue(valueToStore);
            // Save to local storage
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            // A more advanced implementation would handle the error case
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    };

    // Sync between tabs
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === key && e.newValue) {
                try {
                    setStoredValue(JSON.parse(e.newValue));
                } catch (error) {
                    console.error(`Error parsing localStorage key "${key}":`, error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key]);

    return [storedValue, setValue];
};

// Hook for storing user preferences
export const useUserPreferences = () => {
    const [preferences, setPreferences] = useLocalStorage('meditracker_preferences', {
        theme: 'light',
        notifications: true,
        reminderSound: 'gentle',
        reminderVolume: 80,
        timeFormat: '12h',
        language: 'en',
        medicationView: 'grid',
        autoBackup: true,
        dataRetention: 365,
        emergencyContacts: [],
        healthMetrics: ['blood_pressure', 'glucose', 'weight']
    });

    const updatePreference = (key, value) => {
        setPreferences(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const resetPreferences = () => {
        setPreferences({
            theme: 'light',
            notifications: true,
            reminderSound: 'gentle',
            reminderVolume: 80,
            timeFormat: '12h',
            language: 'en',
            medicationView: 'grid',
            autoBackup: true,
            dataRetention: 365,
            emergencyContacts: [],
            healthMetrics: ['blood_pressure', 'glucose', 'weight']
        });
    };

    return {
        preferences,
        updatePreference,
        resetPreferences,
        
        // Convenience methods
        toggleTheme: () => 
            updatePreference('theme', preferences.theme === 'light' ? 'dark' : 'light'),
        
        toggleNotifications: () => 
            updatePreference('notifications', !preferences.notifications),
        
        addEmergencyContact: (contact) => 
            updatePreference('emergencyContacts', [...preferences.emergencyContacts, contact]),
        
        removeEmergencyContact: (contactId) => 
            updatePreference('emergencyContacts', 
                preferences.emergencyContacts.filter(c => c.id !== contactId)
            )
    };
};

// Hook for medication history tracking
export const useMedicationHistory = () => {
    const [history, setHistory] = useLocalStorage('meditracker_history', []);

    const addHistoryEntry = (entry) => {
        const newEntry = {
            ...entry,
            id: Date.now().toString(),
            timestamp: new Date().toISOString()
        };
        
        setHistory(prev => [newEntry, ...prev.slice(0, 999)]); // Keep last 1000 entries
    };

    const clearHistory = () => {
        setHistory([]);
    };

    const getHistoryByDate = (date) => {
        const targetDate = new Date(date).toDateString();
        return history.filter(entry => 
            new Date(entry.timestamp).toDateString() === targetDate
        );
    };

    const getHistoryByMedication = (medicationId) => {
        return history.filter(entry => entry.medicationId === medicationId);
    };

    const getAdherenceRate = (medicationId, days = 30) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const relevantHistory = history.filter(entry => 
            entry.medicationId === medicationId && 
            new Date(entry.timestamp) >= cutoffDate
        );
        
        const takenEntries = relevantHistory.filter(entry => entry.action === 'taken');
        const totalEntries = relevantHistory.length;
        
        return totalEntries > 0 ? Math.round((takenEntries.length / totalEntries) * 100) : 0;
    };

    return {
        history,
        addHistoryEntry,
        clearHistory,
        getHistoryByDate,
        getHistoryByMedication,
        getAdherenceRate
    };
};