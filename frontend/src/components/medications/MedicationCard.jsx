import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiClock, FiCalendar, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { FaPills } from 'react-icons/fa'; // Corrected
import { useMedications } from '../../context/MedicationContext';

const MedicationCard = ({ medication }) => {
    const { deleteMedication } = useMedications();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete ${medication.name}?`)) {
            setIsDeleting(true);
            await deleteMedication(medication._id);
            setIsDeleting(false);
        }
    };

    // const getScheduleText = () => {
    //     if (!medication.schedule || medication.schedule.length === 0) {
    //         return 'No schedule set';
    //     }
        
    //     const times = medication.schedule.map(s => s.time);
    //     if (times.length === 1) {
    //         return `Daily at ${times[0]}`;
    //     }
    //     return `${times.length} times daily`;
    // };
    const getScheduleText = () => {
    if (!medication.schedule || medication.schedule.length === 0) {
        return 'No schedule set';
    }

    // Flatten all times into a single array
    const allTimes = medication.schedule.flatMap(s => s.times || []);

    if (allTimes.length === 1) {
        return `Daily at ${allTimes[0]}`;
    }

    return `${allTimes.length} times daily`;
};


    const getNextDoseTime = () => {
    const now = new Date();

    if (!Array.isArray(medication?.schedule)) {
        return "No upcoming dose";
    }

    const todayTimes = medication.schedule
        .filter(s => typeof s?.time === "string" && s.time.includes(":"))
        .map(s => {
            const [hours, minutes] = s.time.split(":");
            const doseTime = new Date(now);
            doseTime.setHours(Number(hours), Number(minutes), 0, 0);
            return doseTime;
        })
        .filter(time => time > now)
        .sort((a, b) => a - b);

    return todayTimes.length > 0
        ? todayTimes[0].toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "No upcoming dose";
};

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden">
            <div className="p-5">
                {/* Medication Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                        <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg mr-3">
                            <FaPills className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">{medication.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{medication.dosage}</p>
                        </div>
                    </div>
                    
                    <div className="flex space-x-2">
                        <Link
                            to={`/medications/edit/${medication._id}`}
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition"
                            title="Edit"
                        >
                            <FiEdit2 className="w-4 h-4" />
                        </Link>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-gray-800 rounded-lg transition disabled:opacity-50"
                            title="Delete"
                        >
                            <FiTrash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Medication Details */}
                <div className="space-y-3">
                    <div className="flex items-center text-sm">
                        <FiClock className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
                        <span className="text-gray-600 dark:text-gray-300">Frequency:</span>
                        <span className="ml-2 font-medium text-gray-800 dark:text-gray-100">{medication.frequency}</span>
                    </div>

                    <div className="flex items-center text-sm">
                        <FiCalendar className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
                        <span className="text-gray-600 dark:text-gray-300">Schedule:</span>
                        <span className="ml-2 font-medium text-gray-800 dark:text-gray-100">{getScheduleText()}</span>
                    </div>

                    {medication.instructions && (
                        <div className="text-sm text-gray-600 dark:text-gray-300 pt-2 border-t border-gray-100 dark:border-gray-700">
                            <p className="font-medium mb-1 text-gray-700 dark:text-gray-200">Instructions:</p>
                            <p className="text-sm">{medication.instructions}</p>
                        </div>
                    )}
                </div>

                {/* Status Badge */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${medication.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                        {medication.isActive ? 'Active' : 'Inactive'}
                    </div>
                    
                    <div className="text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Next dose: </span>
                        <span className="font-medium text-blue-600">{getNextDoseTime()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MedicationCard;
