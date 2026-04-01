import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMedications } from '../../context/MedicationContext';
import Input from '../common/Input';
import Button from '../common/Button';
import Card from '../common/Card';
import { GiPill } from 'react-icons/gi';
import { 
    FiClock, 
    FiCalendar,
    FiEdit2,
    FiPlus,
    FiTrash2,
    FiInfo,
    FiSave,
    FiX
} from 'react-icons/fi';


const MedicationForm = ({ isEditing = false }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addMedication, updateMedication, getMedicationById, loading, error } = useMedications();
    
    // Initialize with backend-compatible structure
    const [formData, setFormData] = useState({
        name: '',
        dosage: '',
        frequency: 'daily', // Changed to match backend enum
        instructions: '',
        schedule: [
            { 
                day: 'everyday', // Changed from 'days' array to 'day' string
                times: ['08:00']  // Changed from 'time' to 'times' array
            }
        ],
        isActive: true
    });
    
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isEditing && id) {
            const medication = getMedicationById(id);
            if (medication) {
                // Transform backend data to frontend format
                const transformedSchedule = medication.schedule && medication.schedule.length > 0 
                    ? medication.schedule.map(sched => ({
                        day: sched.day || 'everyday',
                        times: sched.times || ['08:00']
                    }))
                    : [{ day: 'everyday', times: ['08:00'] }];
                
                setFormData({
                    name: medication.name || '',
                    dosage: medication.dosage || '',
                    frequency: medication.frequency || 'daily',
                    instructions: medication.instructions || '',
                    schedule: transformedSchedule,
                    isActive: medication.isActive !== undefined ? medication.isActive : true
                });
            }
        }
    }, [isEditing, id, getMedicationById]);

    // Days options for the form (these are for display only)
    const dayOptions = [
        { value: 'monday', label: 'Mon' },
        { value: 'tuesday', label: 'Tue' },
        { value: 'wednesday', label: 'Wed' },
        { value: 'thursday', label: 'Thu' },
        { value: 'friday', label: 'Fri' },
        { value: 'saturday', label: 'Sat' },
        { value: 'sunday', label: 'Sun' }
    ];

    // Day mapping for backend (abbreviated format)
    const dayMap = {
        'monday': 'mon',
        'tuesday': 'tue',
        'wednesday': 'wed',
        'thursday': 'thu',
        'friday': 'fri',
        'saturday': 'sat',
        'sunday': 'sun'
    };

    const frequencyOptions = [
        { label: 'Once Daily', value: 'once_daily' },
        { label: 'Twice Daily', value: 'twice_daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'As Needed', value: 'custom' }
    ];

    const validateForm = () => {
        const errors = {};
        
        if (!formData.name.trim()) errors.name = 'Medication name is required';
        if (!formData.dosage.trim()) errors.dosage = 'Dosage is required';
        if (formData.schedule.length === 0) errors.schedule = 'At least one schedule time is required';
        
        formData.schedule.forEach((schedule, index) => {
            if (!schedule.times || schedule.times.length === 0 || !schedule.times[0]) {
                errors[`schedule-${index}-times`] = 'Time is required';
            }
        });
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    // Handle schedule changes
    const handleScheduleChange = (index, field, value) => {
        const updatedSchedule = [...formData.schedule];
        
        if (field === 'day') {
            updatedSchedule[index].day = value;
        } 
        else if (field === 'times') {
            updatedSchedule[index].times = [value]; // Single time for now
        }
        else if (field === 'addTime') {
            if (!updatedSchedule[index].times) updatedSchedule[index].times = [];
            updatedSchedule[index].times.push(value || '08:00');
        }
        else if (field === 'removeTime') {
            if (updatedSchedule[index].times.length > 1) {
                updatedSchedule[index].times.splice(value, 1);
            }
        }
        
        setFormData(prev => ({ ...prev, schedule: updatedSchedule }));
        
        // Clear any errors for this field
        if (formErrors[`schedule-${index}-${field}`]) {
            setFormErrors(prev => ({ ...prev, [`schedule-${index}-${field}`]: '' }));
        }
        if (formErrors.schedule) {
            setFormErrors(prev => ({ ...prev, schedule: '' }));
        }
    };

    // Transform days array to backend format
    const transformDaysForBackend = (frontendDays) => {
        if (frontendDays.includes('everyday')) return 'everyday';
        
        // Map full names to abbreviated format
        return frontendDays.map(day => dayMap[day] || day);
    };

    // Prepare data for backend
    const prepareDataForBackend = () => {
        const backendData = {
            name: formData.name.trim(),
            dosage: formData.dosage.trim(),
            frequency: formData.frequency,
            instructions: formData.instructions.trim(),
            isActive: formData.isActive,
            schedule: []
        };

        // Transform schedule for backend
        formData.schedule.forEach(sched => {
            // Handle days conversion
            let dayValue = 'everyday';
            if (sched.day !== 'everyday' && Array.isArray(sched.day)) {
                dayValue = transformDaysForBackend(sched.day);
            } else if (sched.day !== 'everyday') {
                dayValue = dayMap[sched.day] || sched.day;
            }

            // Handle times (ensure they're in 24-hour format)
            const times = Array.isArray(sched.times) 
                ? sched.times.map(time => {
                    // Convert from "13:20" format (time input gives 24-hour)
                    return time;
                })
                : ['08:00']; // Default

            backendData.schedule.push({
                day: dayValue,
                times: times
            });
        });

        return backendData;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            // Prepare data for backend
            const backendData = prepareDataForBackend();
            
            console.log('Sending to backend:', JSON.stringify(backendData, null, 2));
            
            const result = isEditing 
                ? await updateMedication(id, backendData)
                : await addMedication(backendData);
                
            if (result.success) {
                navigate('/medications');
            }
        } catch (err) {
            console.error('Submission error:', err);
        } finally {
            setSubmitting(false);
        }
    };

    // Add new schedule item
    const addSchedule = () => setFormData(prev => ({
        ...prev,
        schedule: [...prev.schedule, { day: 'everyday', times: ['08:00'] }]
    }));

    // Remove schedule item
    const removeSchedule = (index) => {
        if (formData.schedule.length > 1) {
            setFormData(prev => ({ 
                ...prev, 
                schedule: prev.schedule.filter((_, i) => i !== index) 
            }));
        }
    };

    // UI Helper: Format day display
    const formatDayDisplay = (dayValue) => {
        if (dayValue === 'everyday') return 'Every Day';
        if (Array.isArray(dayValue)) {
            return dayValue.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
        }
        return dayValue.charAt(0).toUpperCase() + dayValue.slice(1);
    };

    // Day selection handler (for UI)
    const handleDaySelection = (index, selectedDay) => {
        const updatedSchedule = [...formData.schedule];
        const currentSchedule = updatedSchedule[index];
        
        if (selectedDay === 'everyday') {
            currentSchedule.day = 'everyday';
        } else {
            if (currentSchedule.day === 'everyday') {
                currentSchedule.day = [selectedDay];
            } else {
                const currentDays = Array.isArray(currentSchedule.day) ? currentSchedule.day : [currentSchedule.day];
                if (currentDays.includes(selectedDay)) {
                    currentSchedule.day = currentDays.filter(d => d !== selectedDay);
                    if (currentSchedule.day.length === 0) {
                        currentSchedule.day = 'everyday';
                    }
                } else {
                    currentSchedule.day = [...currentDays, selectedDay];
                }
            }
        }
        
        setFormData(prev => ({ ...prev, schedule: updatedSchedule }));
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header remains the same */}
            <div className="mb-8 flex items-center mb-2">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg mr-3">
                    {isEditing ? <FiEdit2 className="w-6 h-6 text-white" /> : <FiPlus className="w-6 h-6 text-white" />}
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isEditing ? 'Edit Medication' : 'Add New Medication'}
                    </h1>
                    <p className="text-gray-600">
                        {isEditing ? 'Update your medication details and schedule' : 'Add a new medication to your tracking list'}
                    </p>
                </div>
            </div>

            {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-700">{error}</p></div>}

            <Card className="mb-6">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Information - Same as before */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <GiPill className="w-5 h-5 mr-2 text-blue-600" /> Basic Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input 
                                label="Medication Name *" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleInputChange} 
                                placeholder="e.g., Paracetamol" 
                                error={formErrors.name} 
                                required 
                            />
                            <Input 
                                label="Dosage *" 
                                name="dosage" 
                                value={formData.dosage} 
                                onChange={handleInputChange} 
                                placeholder="e.g., 500mg" 
                                error={formErrors.dosage} 
                                required 
                            />
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                            <select 
                                name="frequency" 
                                value={formData.frequency} 
                                onChange={handleInputChange} 
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {frequencyOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* UPDATED Schedule Section */}
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center">
                                <FiClock className="w-5 h-5 mr-2 text-blue-600" /> Schedule
                            </h2>
                            <button 
                                type="button" 
                                onClick={addSchedule} 
                                className="flex items-center text-blue-600 hover:text-blue-800"
                            >
                                <FiPlus className="w-4 h-4 mr-1" /> Add Another Time
                            </button>
                        </div>

                        {formErrors.schedule && <p className="text-red-600 text-sm mb-4">{formErrors.schedule}</p>}

                        <div className="space-y-6">
                            {formData.schedule.map((schedule, index) => (
                                <Card key={index} variant="filled" className="relative">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-gray-800">Schedule #{index + 1}</h3>
                                        {formData.schedule.length > 1 && (
                                            <button 
                                                type="button" 
                                                onClick={() => removeSchedule(index)} 
                                                className="text-red-600 hover:text-red-800 p-2"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Time Input */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Time *
                                            </label>
                                            <input 
                                                type="time" 
                                                value={schedule.times ? schedule.times[0] : '08:00'}
                                                onChange={(e) => handleScheduleChange(index, 'times', e.target.value)}
                                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                                    formErrors[`schedule-${index}-times`] ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            />
                                            {formErrors[`schedule-${index}-times`] && (
                                                <p className="text-red-600 text-sm mt-1">
                                                    {formErrors[`schedule-${index}-times`]}
                                                </p>
                                            )}
                                        </div>

                                        {/* Days Selection - UPDATED */}
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Days *
                                                </label>
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleDaySelection(index, 'everyday')}
                                                    className="text-sm text-blue-600 hover:text-blue-800"
                                                >
                                                    {schedule.day === 'everyday' ? 'Clear All' : 'Select All Days'}
                                                </button>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <button 
                                                    type="button"
                                                    onClick={() => handleDaySelection(index, 'everyday')}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                                        schedule.day === 'everyday' 
                                                            ? 'bg-blue-600 text-white' 
                                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    }`}
                                                >
                                                    Everyday
                                                </button>
                                                
                                                {dayOptions.map(day => {
                                                    const isSelected = schedule.day === 'everyday' || 
                                                                      (Array.isArray(schedule.day) && schedule.day.includes(day.value)) ||
                                                                      schedule.day === day.value;
                                                    return (
                                                        <button 
                                                            key={day.value} 
                                                            type="button" 
                                                            onClick={() => handleDaySelection(index, day.value)}
                                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                                                isSelected 
                                                                    ? 'bg-blue-600 text-white' 
                                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                            }`}
                                                        >
                                                            {day.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <p className="text-sm text-gray-500 mt-2">
                                                Selected: {formatDayDisplay(schedule.day)}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Additional Information - Same as before */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <FiInfo className="w-5 h-5 mr-2 text-blue-600" /> Additional Information
                        </h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Instructions (Optional)
                            </label>
                            <textarea 
                                name="instructions" 
                                value={formData.instructions} 
                                onChange={handleInputChange} 
                                rows="4" 
                                placeholder="e.g., Take with food" 
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                            />
                        </div>

                        <div className="mt-6 flex items-center">
                            <input 
                                type="checkbox" 
                                id="isActive" 
                                name="isActive" 
                                checked={formData.isActive} 
                                onChange={handleInputChange} 
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                            />
                            <label htmlFor="isActive" className="ml-2 text-gray-700">
                                This medication is currently active
                            </label>
                        </div>
                    </div>

                    {/* Form Actions - Same as before */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => navigate('/medications')} 
                            disabled={submitting}
                        >
                            <FiX className="w-4 h-4 mr-2" /> Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            variant="primary" 
                            loading={submitting || loading} 
                            disabled={submitting || loading}
                        >
                            <FiSave className="w-4 h-4 mr-2" /> 
                            {isEditing ? 'Update Medication' : 'Add Medication'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default MedicationForm;