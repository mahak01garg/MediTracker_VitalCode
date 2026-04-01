import { useState, useEffect, useCallback } from 'react';
import { medicationAPI } from '../api/medications';
import { useAuth } from './useAuth';

export const useMedications = () => {
    const [medications, setMedications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { isAuthenticated } = useAuth();

    const fetchMedications = useCallback(async () => {
        if (!isAuthenticated) {
            setMedications([]);
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const data = await medicationAPI.getAll();
            setMedications(data);
            return { success: true, data };
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to fetch medications';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchMedications();
    }, [fetchMedications]);

    const addMedication = async (medicationData) => {
        setLoading(true);
        setError(null);
        
        try {
            const data = await medicationAPI.create(medicationData);
            setMedications(prev => [...prev, data]);
            return { success: true, data };
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to add medication';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const updateMedication = async (id, medicationData) => {
        setLoading(true);
        setError(null);
        
        try {
            const data = await medicationAPI.update(id, medicationData);
            setMedications(prev => 
                prev.map(med => med._id === id ? { ...med, ...data } : med)
            );
            return { success: true, data };
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to update medication';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const deleteMedication = async (id) => {
        setLoading(true);
        setError(null);
        
        try {
            await medicationAPI.delete(id);
            setMedications(prev => prev.filter(med => med._id !== id));
            return { success: true };
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to delete medication';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const getMedicationById = (id) => {
        return medications.find(med => med._id === id);
    };

    const getActiveMedications = () => {
        return medications.filter(med => med.isActive);
    };

    const getTodayMedications = () => {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        return medications.filter(med => 
            med.isActive && med.schedule?.some(schedule => 
                schedule.days?.includes(today)
            )
        );
    };

    const getMedicationStats = () => {
        const activeMeds = getActiveMedications();
        const todayMeds = getTodayMedications();
        
        return {
            total: medications.length,
            active: activeMeds.length,
            today: todayMeds.length,
            inactive: medications.length - activeMeds.length
        };
    };

    return {
        medications,
        loading,
        error,
        fetchMedications,
        addMedication,
        updateMedication,
        deleteMedication,
        getMedicationById,
        getActiveMedications,
        getTodayMedications,
        getMedicationStats,
        setError
    };
};

// Hook for medication reminders
export const useMedicationReminders = () => {
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchReminders = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const data = await medicationAPI.getTodayDoses();
            setReminders(data);
            return { success: true, data };
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to fetch reminders';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const markDoseTaken = async (doseId, takenAt = new Date()) => {
        setLoading(true);
        setError(null);
        
        try {
            const data = await medicationAPI.markDoseTaken(doseId, { takenAt });
            
            // Update local state
            setReminders(prev => 
                prev.map(reminder => 
                    reminder._id === doseId 
                        ? { ...reminder, status: 'taken', takenAt } 
                        : reminder
                )
            );
            
            return { success: true, data };
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to mark dose as taken';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const markDoseMissed = async (doseId) => {
        setLoading(true);
        setError(null);
        
        try {
            const data = await medicationAPI.markDoseMissed(doseId);
            
            // Update local state
            setReminders(prev => 
                prev.map(reminder => 
                    reminder._id === doseId 
                        ? { ...reminder, status: 'missed', missedAt: new Date() } 
                        : reminder
                )
            );
            
            return { success: true, data };
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to mark dose as missed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const getUpcomingReminders = () => {
        const now = new Date();
        return reminders.filter(reminder => 
            reminder.status === 'pending' && 
            new Date(reminder.scheduledTime) > now
        );
    };

    const getOverdueReminders = () => {
        const now = new Date();
        return reminders.filter(reminder => 
            reminder.status === 'pending' && 
            new Date(reminder.scheduledTime) <= now
        );
    };

    return {
        reminders,
        loading,
        error,
        fetchReminders,
        markDoseTaken,
        markDoseMissed,
        getUpcomingReminders,
        getOverdueReminders
    };
};