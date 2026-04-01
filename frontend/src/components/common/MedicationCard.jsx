// src/components/MedicationCard.jsx
// import React from "react";
// import { FaPills } from "react-icons/fa";

// const MedicationCard = ({ medication }) => {
//   return (
//     <div className="p-4 rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
//       <div className="flex items-center justify-between">
//         <div className="flex items-center space-x-2">
//           <FaPills className="text-blue-600 w-5 h-5" />
//           <p className="font-medium text-gray-900 dark:text-gray-100">{medication.name}</p>
//         </div>
//         <span className="text-sm text-gray-500 dark:text-gray-400">{medication.dosage}</span>
//       </div>
//       <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
//         <p>Frequency: {medication.frequency || "Daily"}</p>
//         <p>Schedule: {medication.schedule || "Not set"}</p>
//       </div>
//       <div className="mt-2">
//         <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100">
//           {medication.isActive ? "Active" : "Inactive"}
//         </span>
//       </div>
//     </div>
//   );
// };

// export default MedicationCard;
// import React from "react";
// import { FaPills } from "react-icons/fa";

// const MedicationCard = ({ medication }) => {
//   const totalTimes =
//     Array.isArray(medication?.schedule)
//       ? medication.schedule.reduce(
//           (sum, item) => sum + (item?.times?.length || 0),
//           0
//         )
//       : 0;

//   return (
//     <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div className="flex items-center space-x-2">
//           <FaPills className="text-blue-600 w-5 h-5" />
//           <p className="font-medium text-gray-900 dark:text-gray-100">
//             {medication?.name || "Unnamed Medication"}
//           </p>
//         </div>
//         <span className="text-sm text-gray-600 dark:text-gray-400">
//           {medication?.dosage || "—"}
//         </span>
//       </div>

//       {/* Details */}
//       <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
//         <p>
//           <span className="font-medium text-gray-700 dark:text-gray-300">
//             Frequency:
//           </span>{" "}
//           {medication?.frequency || "Daily"}
//         </p>
//         <p>
//           <span className="font-medium text-gray-700 dark:text-gray-300">
//             Schedule:
//           </span>{" "}
//           {totalTimes > 0 ? `${totalTimes} times` : "Not set"}
//         </p>
//       </div>

//       {/* Status */}
//       <div className="mt-3">
//         <span
//           className={`px-3 py-1 text-xs font-medium rounded-full ${
//             medication?.isActive
//               ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200"
//               : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
//           }`}
//         >
//           {medication?.isActive ? "Active" : "Inactive"}
//         </span>
//       </div>
//     </div>
//   );
// };

// export default MedicationCard;

// import React from "react";
// import { FaPills } from "react-icons/fa";

// const MedicationCard = ({ medication }) => {
//   const totalTimes = Array.isArray(medication?.schedule)
//     ? medication.schedule.reduce(
//         (sum, item) => sum + (item?.times?.length || 0),
//         0
//       )
//     : 0;

//   return (
//     <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow">
      
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div className="flex items-center space-x-2">
//           <FaPills className="text-blue-600 w-5 h-5" />
//           <p className="font-medium text-gray-900 dark:text-gray-100">
//             {medication?.name || "Unnamed Medication"}
//           </p>
//         </div>
//         <span className="text-sm text-gray-700 dark:text-gray-300">
//           {medication?.dosage || "—"}
//         </span>
//       </div>

//       {/* Details */}
//       <div className="mt-3 text-sm space-y-1">
//         <p className="text-gray-700 dark:text-gray-200">
//           <span className="font-semibold">Frequency:</span>{" "}
//           {medication?.frequency || "Daily"}
//         </p>
//         <p className="text-gray-700 dark:text-gray-200">
//           <span className="font-semibold">Schedule:</span>{" "}
//           {totalTimes > 0 ? `${totalTimes} times` : "Not set"}
//         </p>
//       </div>

//       {/* Status */}
//       <div className="mt-3">
//         <span
//           className={`px-3 py-1 text-xs font-medium rounded-full ${
//             medication?.isActive
//               ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200"
//               : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
//           }`}
//         >
//           {medication?.isActive ? "Active" : "Inactive"}
//         </span>
//       </div>
//     </div>
//   );
// };

// export default MedicationCard;
// import React from "react";
// import { FaPills } from "react-icons/fa";

// const MedicationCard = ({ medication }) => {
//   const totalTimes = Array.isArray(medication?.schedule)
//     ? medication.schedule.reduce((sum, item) => sum + (item?.times?.length || 0), 0)
//     : 0;

//   return (
//     <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-lg transition-shadow duration-200">
      
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div className="flex items-center space-x-2">
//           <FaPills className="text-blue-600 w-5 h-5" />
//           <p className="font-medium text-gray-900 dark:text-gray-100">
//             {medication?.name || "Unnamed Medication"}
//           </p>
//         </div>
//         <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
//           {medication?.dosage || "—"}
//         </span>
//       </div>

//       {/* Details */}
//       <div className="mt-3 text-sm space-y-1">
//         <p className="text-gray-700 dark:text-gray-200">
//           <span className="font-semibold">Frequency: </span>
//           <span className="font-normal">{medication?.frequency || "Daily"}</span>
//         </p>
//         <p className="text-gray-700 dark:text-gray-200">
//           <span className="font-semibold">Schedule: </span>
//           <span className="font-normal">{totalTimes > 0 ? `${totalTimes} times` : "Not set"}</span>
//         </p>
//       </div>

//       {/* Status */}
//       <div className="mt-3">
//         <span
//           className={`px-3 py-1 text-xs font-medium rounded-full ${
//             medication?.isActive
//               ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200"
//               : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
//           }`}
//         >
//           {medication?.isActive ? "Active" : "Inactive"}
//         </span>
//       </div>
//     </div>
//   );
// };

// export default MedicationCard;
import React from "react";
import { FaPills } from "react-icons/fa";

const MedicationCard = ({ medication }) => {
  // Convert schedule to readable string
  const scheduleTimes = Array.isArray(medication?.schedule)
    ? medication.schedule
        .map((item) => (item?.times ? item.times.join(", ") : "Not set"))
        .join(" | ")
    : "Not set";

  const frequency = medication?.frequency || "Daily";

  return (
    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-lg transition-shadow duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FaPills className="text-blue-600 w-5 h-5" />
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {medication?.name || "Unnamed Medication"}
          </p>
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {medication?.dosage || "—"}
        </span>
      </div>

      {/* Details */}
      <div className="mt-3 text-sm space-y-1">
        <p className="text-gray-700 dark:text-gray-200">
          <span className="font-semibold">Frequency: </span>
          <span className="font-normal">{frequency}</span>
        </p>
        <p className="text-gray-700 dark:text-gray-200">
          <span className="font-semibold">Schedule: </span>
          <span className="font-normal">{scheduleTimes}</span>
        </p>
      </div>

      {/* Status */}
      <div className="mt-3">
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full ${
            medication?.isActive
              ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200"
              : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
          }`}
        >
          {medication?.isActive ? "Active" : "Inactive"}
        </span>
      </div>
    </div>
  );
};

export default MedicationCard;
