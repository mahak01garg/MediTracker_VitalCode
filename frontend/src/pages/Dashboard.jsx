// import React, { useEffect, useState, useMemo, useCallback } from "react";
// import { Link } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import { useMedications } from "../context/MedicationContext";
// import MedicationCard from "../components/medications/MedicationCard";
// import ReminderCard from "../components/medications/ReminderCard";
// import Chatbot from "../components/ai/Chatbot";
// import { rewardAPI } from "../api/reward";
// import axios from 'axios';
// import {
//   FiCheckCircle,
//   FiTrendingUp,
//   FiClock,
//   FiBell,
// } from "react-icons/fi";
// import { FaPills } from "react-icons/fa";

// const Dashboard = () => {
//   const { user } = useAuth();
//   const { medications, fetchMedications } = useMedications();
  
//   // All hooks must be at the TOP, in same order every render
//   const [streak, setStreak] = useState(0);
//   const [upcomingDoses, setUpcomingDoses] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [rewardPoints, setRewardPoints] = useState(0);

//   /* ------------------ FETCH FUNCTIONS ------------------ */
//   const fetchTodayDoses = useCallback(async () => {
//     try {
//       const token = localStorage.getItem("token");
//       const response = await axios.get(
//         "http://localhost:5000/api/medications/upcoming/today",
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );
      
//       console.log("Today's doses response:", response.data);
      
//       if (response.data && Array.isArray(response.data.doses)) {
//         setUpcomingDoses(response.data.doses);
//         console.log("Set upcoming doses:", response.data.doses.length);
//       } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
//         setUpcomingDoses(response.data.data);
//       } else {
//         console.log("No doses array found in response");
//       }
//     } catch (error) {
//       console.error("Error fetching today's doses:", error);
//     }
//   }, []);

//   const generateDosesForActiveMedications = useCallback(async () => {
//     try {
//       const token = localStorage.getItem("token");
//       const activeMeds = medications.filter(m => m.isActive);
      
//       for (const med of activeMeds) {
//         await axios.post(
//           `http://localhost:5000/api/medications/${med._id}/doses/generate`,
//           {},
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );
//       }
      
//       await fetchTodayDoses();
//     } catch (error) {
//       console.error("Error generating doses:", error);
//     }
//   }, [medications, fetchTodayDoses]);

//   const calculateDosesFromSchedule = useCallback(() => {
//     const doses = [];
//     const now = new Date();
//     const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
//     medications.forEach(med => {
//       if (!med.isActive || !med.schedule || !Array.isArray(med.schedule)) return;
      
//       med.schedule.forEach(schedule => {
//         schedule.times.forEach(time => {
//           const [hours, minutes] = time.split(':').map(Number);
//           const scheduledTime = new Date(today);
//           scheduledTime.setHours(hours, minutes, 0, 0);
          
//           if (scheduledTime > now) {
//             doses.push({
//               _id: `${med._id}-${time}-${today.getTime()}`,
//               medicationId: {
//                 _id: med._id,
//                 name: med.name,
//                 dosage: med.dosage
//               },
//               medicationName: med.name,
//               scheduledTime: scheduledTime.toISOString(),
//               status: 'pending',
//               dosage: med.dosage
//             });
//           }
//         });
//       });
//     });
    
//     setUpcomingDoses(doses.sort((a, b) => 
//       new Date(a.scheduledTime) - new Date(b.scheduledTime)
//     ));
//   }, [medications]);

//   const handleDoseAction = useCallback(async (doseId, action) => {
//     console.log("Processing dose action:", { doseId, action });
    
//     const isRealDoseId = /^[0-9a-fA-F]{24}$/.test(doseId);
    
//     if (isRealDoseId) {
//       try {
//         const token = localStorage.getItem("token");
//         const response = await axios.put(
//           `http://localhost:5000/api/medications/doses/${doseId}`,
//           { status: action },
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );
        
//         console.log("Dose updated:", response.data);
//         setUpcomingDoses(prev => prev.filter(dose => dose._id !== doseId));
        
//         const rewardRes = await rewardAPI.getPoints();
//         setRewardPoints(rewardRes?.points ?? rewardRes?.totalPoints ?? 0);
        
//         if (action === 'taken') {
//           setStreak(prev => prev + 1);
//         } else if (action === 'missed') {
//           setStreak(0);
//         }
        
//         alert(`✅ Dose marked as ${action}!`);
        
//       } catch (error) {
//         console.error("Error updating dose:", error);
//         alert(`Failed to update dose: ${error.response?.data?.error || error.message}`);
//       }
//     } else {
//       console.log("Mock dose, updating UI only");
//       setUpcomingDoses(prev => prev.filter(dose => dose._id !== doseId));
      
//       if (action === 'taken') {
//         setStreak(prev => prev + 1);
//         setRewardPoints(prev => prev + 10);
//       }
      
//       alert(`✅ Dose marked as ${action}! (UI only)`);
//     }
//   }, []);

//   const calculateStreakFromLocalData = useCallback(() => {
//     const today = new Date();
//     const yesterday = new Date(today);
//     yesterday.setDate(yesterday.getDate() - 1);
    
//     const dosesTakenToday = upcomingDoses.filter(d => 
//       d.status === 'taken' && 
//       d.takenAt && 
//       new Date(d.takenAt).toDateString() === today.toDateString()
//     ).length;
    
//     if (dosesTakenToday > 0) {
//       setStreak(prev => prev + 1);
//     } else {
//       // Don't reset to 0 automatically - streak might continue from yesterday
//       // We'll fetch real streak from backend
//     }
//   }, [upcomingDoses]);

//   const testAllEndpoints = useCallback(async () => {
//     const token = localStorage.getItem("token");
//     const baseURL = "http://localhost:5000/api";
//     const endpoints = [
//       "/medications/upcoming/today",
//       "/medications/doses",
//       "/medications",
//     ];

//     console.log("=== Testing Backend Endpoints ===");
    
//     for (const endpoint of endpoints) {
//       try {
//         const res = await axios.get(`${baseURL}${endpoint}`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         console.log(`✅ ${endpoint}:`, res.status, res.data);
//       } catch (err) {
//         console.log(`❌ ${endpoint}:`, err.response?.status || err.message);
//       }
//     }
//   }, []);

//   const loadDashboard = useCallback(async () => {
//     setLoading(true);
//     try {
//       await fetchMedications();
//       await fetchTodayDoses();
      
//       const rewardRes = await rewardAPI.getPoints();
//       setRewardPoints(rewardRes?.points ?? rewardRes?.totalPoints ?? 0);
      
//     } catch (err) {
//       console.error("Dashboard load error:", err);
//     } finally {
//       setLoading(false);
//     }
//   }, [fetchMedications, fetchTodayDoses]);

//   /* ------------------ USE EFFECTS ------------------ */
//   // All useEffects must be after all useState declarations
//   useEffect(() => {
//     loadDashboard();
//   }, [loadDashboard]);

//   useEffect(() => {
//     testAllEndpoints();
//   }, [testAllEndpoints]);

//   useEffect(() => {
//     if (upcomingDoses.length > 0) {
//       calculateStreakFromLocalData();
//     }
//   }, [upcomingDoses, calculateStreakFromLocalData]);

//   /* ------------------ DERIVED VALUES ------------------ */
//   const activeMedications = useMemo(
//     () => medications.filter((m) => m.isActive).length,
//     [medications]
//   );

//   const dosesToday = useMemo(
//     () => upcomingDoses.length,
//     [upcomingDoses]
//   );

//   /* ------------------ STATS CONFIG ------------------ */
//   const statCards = useMemo(() => [
//     {
//       title: "Active Medications",
//       value: activeMedications,
//       icon: FaPills,
//       color: "bg-blue-500",
//       textColor: "text-blue-600",
//       bgColor: "bg-blue-50",
//     },
//     {
//       title: "Today's Doses",
//       value: dosesToday,
//       icon: FiCheckCircle,
//       color: "bg-green-500",
//       textColor: "text-green-600",
//       bgColor: "bg-green-50",
//     },
//     {
//       title: "Current Streak",
//       value: `${streak} days`,
//       icon: FiTrendingUp,
//       color: streak > 0 ? "bg-purple-500" : "bg-gray-300",
//       textColor: streak > 0 ? "text-purple-600" : "text-gray-600",
//       bgColor: streak > 0 ? "bg-purple-50" : "bg-gray-50",
//     },
//     {
//       title: "Reward Points",
//       value: rewardPoints,
//       icon: FiBell,
//       color: "bg-yellow-500",
//       textColor: "text-yellow-600",
//       bgColor: "bg-yellow-50",
//     },
//   ], [activeMedications, dosesToday, streak, rewardPoints]);

//   /* ------------------ LOADER ------------------ */
//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Welcome */}
//       <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
//         <h1 className="text-3xl font-bold">
//           Welcome back, {user?.name?.split(" ")[0] || "User"} 👋
//         </h1>
//         <p className="mt-2 text-blue-100">
//           Your medication overview for today
//         </p>
//       </div>

//       {/* Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {statCards.map((stat, idx) => {
//           const Icon = stat.icon;
//           return (
//             <div
//               key={idx}
//               className={`${stat.bgColor} rounded-xl p-6 shadow-sm`}
//             >
//               <div className="flex justify-between items-center">
//                 <div>
//                   <p className="text-sm text-gray-600">{stat.title}</p>
//                   <p
//                     className={`text-2xl font-bold ${stat.textColor} mt-2`}
//                   >
//                     {stat.value}
//                   </p>
//                 </div>
//                 <div className={`${stat.color} p-3 rounded-full`}>
//                   <Icon className="w-6 h-6 text-white" />
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {/* Main Grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* Left */}
//         <div className="lg:col-span-2 space-y-8">
//           {/* Reminders */}
//           <div className="bg-white rounded-xl shadow-sm border">
//             <div className="p-6 border-b flex items-center">
//               <FiClock className="mr-3 text-blue-600" />
//               <h2 className="text-xl font-bold">Upcoming Reminders</h2>
//               <button 
//                 onClick={loadDashboard}
//                 className="ml-auto text-sm bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200"
//               >
//                 Refresh
//               </button>
//             </div>
//             <div className="p-6">
//               {upcomingDoses.length ? (
//                 upcomingDoses.slice(0, 5).map((dose) => (
//                   <ReminderCard
//                     key={dose._id}
//                     dose={dose}
//                     onAction={handleDoseAction}
//                   />
//                 ))
//               ) : (
//                 <div className="text-center py-8">
//                   <p className="text-gray-500 mb-4">No upcoming reminders for today</p>
//                   <button 
//                     onClick={generateDosesForActiveMedications}
//                     className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
//                   >
//                     Generate Today's Doses
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Active Medications */}
//           <div className="bg-white rounded-xl shadow-sm border">
//             <div className="p-6 border-b flex justify-between items-center">
//               <div className="flex items-center">
//                 <FaPills className="mr-3 text-blue-600" />
//                 <h2 className="text-xl font-bold">Active Medications</h2>
//               </div>
//               <Link
//                 to="/medications/add"
//                 className="bg-blue-600 text-white px-4 py-2 rounded-lg"
//               >
//                 + Add New
//               </Link>
//             </div>

//             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
//               {medications
//                 .filter((m) => m.isActive)
//                 .slice(0, 4)
//                 .map((med) => (
//                   <MedicationCard key={med._id} medication={med} />
//                 ))}
//             </div>
//           </div>
//         </div>

//         {/* Right */}
//         <div className="bg-white rounded-xl shadow-sm border">
//           <div className="p-6 border-b">
//             <h2 className="text-xl font-bold">AI Health Assistant</h2>
//             <p className="text-sm text-gray-600">
//               Ask about your medications
//             </p>
//           </div>
//           <div className="p-6">
//             <Chatbot />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMedications } from "../context/MedicationContext";
import MedicationCard from "../components/medications/MedicationCard";
import ReminderCard from "../components/medications/ReminderCard";
import Chatbot from "../components/ai/Chatbot";
import { rewardAPI } from "../api/reward";
import axios from "axios";
import {
  FiCheckCircle,
  FiTrendingUp,
  FiClock,
  FiBell,
} from "react-icons/fi";
import { FaPills } from "react-icons/fa";
import PageDoodle from "../components/common/PageDoodle";

const Dashboard = () => {
  const { user } = useAuth();
  const { medications, fetchMedications } = useMedications();
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const [streak, setStreak] = useState(0);
  const [upcomingDoses, setUpcomingDoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rewardPoints, setRewardPoints] = useState(0);

  const fetchTodayDoses = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_BASE_URL}/medications/upcoming/today`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (Array.isArray(res.data?.doses)) {
        setUpcomingDoses(res.data.doses);
      } else if (Array.isArray(res.data?.data)) {
        setUpcomingDoses(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [API_BASE_URL]);

  const generateDosesForActiveMedications = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/schedule/generate-today-doses`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchTodayDoses();
    } catch (err) {
      console.error(err);
    }
  }, [API_BASE_URL, fetchTodayDoses]);

  const handleDoseAction = useCallback(async (doseId, action) => {
    const isReal = /^[0-9a-fA-F]{24}$/.test(doseId);

    try {
      if (isReal) {
        const token = localStorage.getItem("token");
        await axios.put(
          `${API_BASE_URL}/medications/doses/${doseId}`,
          { status: action },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const rewardRes = await rewardAPI.getPoints();
        setRewardPoints(rewardRes?.points ?? rewardRes?.totalPoints ?? 0);
        await fetchTodayDoses();
      } else {
        setRewardPoints(p => p + 10);
        setUpcomingDoses(prev => prev.filter(d => d._id !== doseId));
      }
      action === "taken" ? setStreak(s => s + 1) : setStreak(0);

    } catch (err) {
      console.error(err);
    }
  }, [API_BASE_URL, fetchTodayDoses]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      await fetchMedications();
      await fetchTodayDoses();
      const rewardRes = await rewardAPI.getPoints();
      setRewardPoints(rewardRes?.points ?? rewardRes?.totalPoints ?? 0);
    } finally {
      setLoading(false);
    }
  }, [fetchMedications, fetchTodayDoses]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const activeMedications = useMemo(
    () => medications.filter(m => m.isActive).length,
    [medications]
  );

  const statCards = [
    {
      title: "Active Medications",
      value: activeMedications,
      icon: FaPills,
      color: "bg-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900",
      text: "text-blue-600 dark:text-blue-300",
    },
    {
      title: "Today's Doses",
      value: upcomingDoses.length,
      icon: FiCheckCircle,
      color: "bg-green-600",
      bg: "bg-green-50 dark:bg-green-900",
      text: "text-green-600 dark:text-green-300",
    },
    {
      title: "Current Streak",
      value: `${streak} days`,
      icon: FiTrendingUp,
      color: "bg-purple-600",
      bg: "bg-purple-50 dark:bg-purple-900",
      text: "text-purple-600 dark:text-purple-300",
    },
    {
      title: "Reward Points",
      value: rewardPoints,
      icon: FiBell,
      color: "bg-yellow-500",
      bg: "bg-yellow-50 dark:bg-yellow-900",
      text: "text-yellow-600 dark:text-yellow-300",
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-6 md:p-8 rounded-2xl text-white shadow-xl overflow-hidden">
        <PageDoodle type="dashboard" className="absolute right-4 top-4 hidden md:block" />
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          Welcome back, {user?.name?.split(" ")[0] || "User"} 👋
        </h1>
        <p className="text-blue-100 mt-2">Your medication overview for today</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`${s.bg} rounded-2xl p-6 border border-white/60 dark:border-gray-700 shadow-sm`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{s.title}</p>
                  <p className={`text-2xl font-bold ${s.text} mt-2`}>{s.value}</p>
                </div>
                <div className={`${s.color} p-3 rounded-full`}>
                  <Icon className="text-white w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">
        {/* Left */}
        <div className="xl:col-span-3 space-y-8">
          {/* Reminders */}
          <div className="bg-white/95 dark:bg-gray-900 border dark:border-gray-700 rounded-2xl shadow-sm">
            <div className="p-6 border-b dark:border-gray-700 flex items-center">
              <FiClock className="text-blue-600 mr-3" />
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                Upcoming Reminders
              </h2>
              <button
                onClick={loadDashboard}
                className="ml-auto bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 px-3 py-1.5 rounded-xl text-sm font-semibold"
              >
                Refresh
              </button>
            </div>

            <div className="p-6">
              {upcomingDoses.length ? (
                upcomingDoses.slice(0, 5).map(dose => (
                  <ReminderCard
                    key={dose._id}
                    dose={dose}
                    onAction={handleDoseAction}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No upcoming reminders
                  </p>
                  <button
                    onClick={generateDosesForActiveMedications}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
                  >
                    Generate Today's Doses
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Active Meds */}
          <div className="bg-white/95 dark:bg-gray-900 border dark:border-gray-700 rounded-2xl shadow-sm">
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                Active Medications
              </h2>
              <Link
                to="/medications/add"
                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold"
              >
                + Add New
              </Link>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {medications
                .filter(m => m.isActive)
                .slice(0, 4)
                .map(med => (
                  <MedicationCard key={med._id} medication={med} />
                ))}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="xl:col-span-2 bg-white/95 dark:bg-gray-900 border dark:border-gray-700 rounded-2xl shadow-sm">
          <div className="p-6 border-b dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              AI Health Assistant
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ask about your medications
            </p>
          </div>
          <div className="p-6 lg:p-7">
            <Chatbot />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
