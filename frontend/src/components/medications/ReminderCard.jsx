import React, { useState } from 'react';
import { FiClock, FiCheckCircle, FiXCircle, FiBell } from 'react-icons/fi';

const ReminderCard = ({ dose, onAction }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleAction = async (action) => {
        setIsLoading(true);
        try {
            await onAction(dose._id, action);
        } catch (error) {
            console.error('Action failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getTimeDifference = () => {
        const now = new Date();
        const doseTime = new Date(dose.scheduledTime);
        const diffMs = doseTime - now;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 0) {
            return `${Math.abs(diffMins)} mins ago`;
        } else if (diffMins === 0) {
            return 'Now';
        } else if (diffMins < 60) {
            return `In ${diffMins} mins`;
        } else {
            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            return `In ${hours}h ${mins}m`;
        }
    };

    const getStatusColor = () => {
        const now = new Date();
        const doseTime = new Date(dose.scheduledTime);
        const diffMins = (doseTime - now) / 60000;

        if (dose.status === 'taken') return 'bg-green-100 text-green-800';
        if (dose.status === 'missed') return 'bg-red-100 text-red-800';
        if (dose.status === 'skipped') return 'bg-yellow-100 text-yellow-800';
        
        if (diffMins < 0) return 'bg-orange-100 text-orange-800';
        if (diffMins <= 30) return 'bg-blue-100 text-blue-800';
        return 'bg-gray-100 text-gray-800';
    };

    const getStatusText = () => {
        if (dose.status === 'taken') return 'Taken';
        if (dose.status === 'missed') return 'Missed';
        if (dose.status === 'skipped') return 'Skipped';
        
        const now = new Date();
        const doseTime = new Date(dose.scheduledTime);
        const diffMins = (doseTime - now) / 60000;

        if (diffMins < 0) return 'Overdue';
        if (diffMins <= 30) return 'Due Soon';
        return 'Upcoming';
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all duration-300">
            <div className="flex items-start justify-between">
                {/* Left side - Medication Info */}
                <div className="flex-1">
                    <div className="flex items-center mb-2">
                        <div className="bg-blue-100 p-2 rounded-lg mr-3">
                            <FiBell className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800">
                                {dose.medicationId?.name || 'Medication'}
                            </h4>
                            <p className="text-sm text-gray-600">
                                {dose.dosage || dose.medicationId?.dosage || ''}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 ml-11">
                        <div className="flex items-center">
                            <FiClock className="w-4 h-4 mr-2" />
                            <span>{formatTime(dose.scheduledTime)}</span>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                            {getStatusText()} • {getTimeDifference()}
                        </div>
                    </div>
                </div>

                {/* Right side - Action Buttons */}
                {dose.status === 'pending' && (
                    <div className="flex space-x-2 ml-4">
                        <button
                            onClick={() => handleAction('taken')}
                            disabled={isLoading}
                            className="flex items-center justify-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
                        >
                            {isLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <FiCheckCircle className="w-4 h-4 mr-2" />
                                    Taken
                                </>
                            )}
                        </button>
                        
                        <button
                            onClick={() => handleAction('missed')}
                            disabled={isLoading}
                            className="flex items-center justify-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
                        >
                            <FiXCircle className="w-4 h-4 mr-2" />
                            Missed
                        </button>
                    </div>
                )}

                {dose.status !== 'pending' && (
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ml-4 ${getStatusColor()}`}>
                        {dose.status === 'taken' && (
                            <span className="flex items-center">
                                <FiCheckCircle className="w-4 h-4 mr-1" />
                                Taken at {dose.takenAt ? formatTime(dose.takenAt) : ''}
                            </span>
                        )}
                        {dose.status === 'missed' && 'Missed'}
                        {dose.status === 'skipped' && 'Skipped'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReminderCard;