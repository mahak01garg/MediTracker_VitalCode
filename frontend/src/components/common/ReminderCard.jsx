// src/components/ReminderCard.jsx
import React from "react";
import { FiClock } from "react-icons/fi";

const ReminderCard = ({ dose, onAction }) => {
  return (
    <div className="p-4 rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex justify-between items-center">
      <div>
        <p className="font-medium text-gray-900 dark:text-gray-100">{dose.name}</p>
        <div className="text-sm text-gray-500 dark:text-gray-400 flex space-x-4 mt-1">
          <span>
            <FiClock className="inline mr-1" />
            {dose.frequency || "Daily"}
          </span>
          <span>Next: {dose.nextDose || "No upcoming dose"}</span>
        </div>
      </div>
      <button
        onClick={() => onAction && onAction(dose)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm"
      >
        Take
      </button>
    </div>
  );
};

export default ReminderCard;
