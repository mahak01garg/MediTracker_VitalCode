
// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { useMedications } from '../context/MedicationContext';
// import MedicationCard from '../components/medications/MedicationCard';
// import Button from '../components/common/Button';
// import Card from '../components/common/Card';
// import Input from '../components/common/Input';
// import { motion } from 'framer-motion';
// import {
//   FiPlus,
//   FiSearch,
//   FiFilter,
//   FiGrid,
//   FiList,
//   FiActivity,
//   FiArchive,
//   FiAlertCircle,
//   FiRefreshCw
// } from 'react-icons/fi';
// import { GiPill } from 'react-icons/gi';

// const Medications = () => {
//   const { medications, loading, error, fetchMedications, getMedicationStats } = useMedications();

//   const [searchTerm, setSearchTerm] = useState('');
//   const [filter, setFilter] = useState('all'); // all, active, inactive
//   const [viewMode, setViewMode] = useState('grid'); // grid or list
//   const [sortBy, setSortBy] = useState('name'); // name, date, frequency

//   useEffect(() => {
//     fetchMedications();
//   }, []);

//   const handleRefresh = () => {
//     fetchMedications();
//   };

//   const filteredMedications = Array.isArray(medications)
//     ? medications
//         .filter((medication) => {
//           const matchesSearch =
//             medication?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//             medication?.dosage?.toLowerCase().includes(searchTerm.toLowerCase());
//           const matchesStatus =
//             filter === 'all' ||
//             (filter === 'active' && medication?.isActive) ||
//             (filter === 'inactive' && !medication?.isActive);
//           return matchesSearch && matchesStatus;
//         })
//         .sort((a, b) => {
//           switch (sortBy) {
//             case 'name':
//               return a?.name?.localeCompare(b?.name);
//             case 'date':
//               return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
//             case 'frequency':
//               const freqOrder = {
//                 'once daily': 1,
//                 'twice daily': 2,
//                 'three times daily': 3,
//                 'four times daily': 4,
//                 'every 6 hours': 5,
//                 'every 8 hours': 6,
//                 'every 12 hours': 7,
//                 weekly: 8,
//                 'as needed': 9,
//                 other: 10
//               };
//               return (freqOrder[a?.frequency] || 10) - (freqOrder[b?.frequency] || 10);
//             default:
//               return 0;
//           }
//         })
//     : [];

//   const stats = getMedicationStats();

//   const filters = [
//     { value: 'all', label: 'All Medications', count: stats.total || 0 },
//     { value: 'active', label: 'Active', count: stats.active || 0 },
//     { value: 'inactive', label: 'Inactive', count: stats.inactive || 0 }
//   ];

//   const sortOptions = [
//     { value: 'name', label: 'Name (A-Z)' },
//     { value: 'date', label: 'Recently Added' },
//     { value: 'frequency', label: 'Frequency' }
//   ];

//   if (loading && (!medications || medications.length === 0)) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="text-center py-12">
//         <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
//         <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Medications</h2>
//         <p className="text-gray-600 mb-6">{error}</p>
//         <Button variant="primary" onClick={handleRefresh}>
//           <FiRefreshCw className="w-5 h-5 mr-2" />
//           Try Again
//         </Button>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900 flex items-center">
//             <GiPill className="w-8 h-8 mr-3 text-blue-600" />
//             My Medications
//           </h1>
//           <p className="text-gray-600 mt-2">
//             Manage your medications, set reminders, and track adherence
//           </p>
//         </div>

//         <Link to="/medications/add">
//           <Button variant="primary" size="large">
//             <FiPlus className="w-5 h-5 mr-2" />
//             Add Medication
//           </Button>
//         </Link>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <Card className="text-center">
//           <div className="text-3xl font-bold text-gray-900">{stats.total || 0}</div>
//           <div className="text-sm text-gray-600">Total Medications</div>
//         </Card>
//         <Card className="text-center">
//           <div className="text-3xl font-bold text-green-600">{stats.active || 0}</div>
//           <div className="text-sm text-gray-600">Active</div>
//         </Card>
//         <Card className="text-center">
//           <div className="text-3xl font-bold text-blue-600">{stats.today || 0}</div>
//           <div className="text-sm text-gray-600">Due Today</div>
//         </Card>
//         <Card className="text-center">
//           <div className="text-3xl font-bold text-yellow-600">
//             {stats.total > 0 ? Math.round(((stats.active || 0) / stats.total) * 100) : 0}%
//           </div>
//           <div className="text-sm text-gray-600">Active Rate</div>
//         </Card>
//       </div>

//       {/* Search & Filters */}
//       <Card>
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
//           {/* Search */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">Search Medications</label>
//             <div className="relative">
//               <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//               <Input
//                 type="text"
//                 placeholder="Search by name or dosage..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="pl-10"
//               />
//             </div>
//           </div>

//           {/* Filter */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               <FiFilter className="inline w-4 h-4 mr-1" />
//               Filter
//             </label>
//             <div className="flex flex-wrap gap-2">
//               {filters.map((filterOption) => (
//                 <button
//                   key={filterOption.value}
//                   onClick={() => setFilter(filterOption.value)}
//                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
//                     filter === filterOption.value
//                       ? 'bg-blue-600 text-white'
//                       : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
//                   }`}
//                 >
//                   {filterOption.label}
//                   {filterOption.count > 0 && (
//                     <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
//                       {filterOption.count}
//                     </span>
//                   )}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Sort & View */}
//           <div className="flex flex-col sm:flex-row gap-4">
//             <div className="flex-1">
//               <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
//               <select
//                 value={sortBy}
//                 onChange={(e) => setSortBy(e.target.value)}
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               >
//                 {sortOptions.map((option) => (
//                   <option key={option.value} value={option.value}>
//                     {option.label}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">View</label>
//               <div className="flex bg-gray-200 rounded-lg p-1">
//                 <button
//                   onClick={() => setViewMode('grid')}
//                   className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}
//                 >
//                   <FiGrid className="w-5 h-5" />
//                 </button>
//                 <button
//                   onClick={() => setViewMode('list')}
//                   className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}
//                 >
//                   <FiList className="w-5 h-5" />
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Refresh */}
//         <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
//           <Button variant="outline" onClick={handleRefresh} loading={loading}>
//             <FiRefreshCw className="w-4 h-4 mr-2" />
//             Refresh
//           </Button>
//         </div>
//       </Card>

//       {/* Medications List */}
//       {filteredMedications.length === 0 ? (
//         <Card className="text-center py-12">
//           <GiPill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//           <h3 className="text-xl font-bold text-gray-900 mb-2">
//             {medications && medications.length > 0 ? 'No matching medications found' : 'No medications yet'}
//           </h3>
//           <p className="text-gray-600 mb-6">
//             {searchTerm || filter !== 'all'
//               ? 'Try adjusting your search or filter criteria'
//               : 'Add your first medication to get started'}
//           </p>
//           <Link to="/medications/add">
//             <Button variant="primary">
//               <FiPlus className="w-5 h-5 mr-2" />
//               Add Your First Medication
//             </Button>
//           </Link>
//         </Card>
//       ) : viewMode === 'grid' ? (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {filteredMedications.map((medication) => (
//             <MedicationCard key={medication._id} medication={medication} />
//           ))}
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {filteredMedications.map((medication) => (
//             <div key={medication._id} className="bg-white rounded-lg border border-gray-200 p-6">
//               <div className="flex justify-between items-start">
//                 <div className="flex-1">
//                   <div className="flex items-center mb-2">
//                     <GiPill className="w-5 h-5 text-blue-600 mr-3" />
//                     <h3 className="font-bold text-gray-900 text-lg">{medication?.name || 'Unnamed Medication'}</h3>
//                     <span
//                       className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${
//                         medication?.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
//                       }`}
//                     >
//                       {medication?.isActive ? 'Active' : 'Inactive'}
//                     </span>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
//                     <div>
//                       <span className="font-medium">Dosage:</span> {medication?.dosage || 'Not specified'}
//                     </div>
//                     <div>
//                       <span className="font-medium">Frequency:</span> {medication?.frequency || 'Not specified'}
//                     </div>
//                     <div>
//                       <span className="font-medium">Schedule:</span>{' '}
//                       {medication?.schedule
//                         ? medication.schedule.reduce((total, item) => total + (item?.times?.length || 0), 0)
//                         : 0}{' '}
//                       times
//                     </div>
//                   </div>

//                   {medication?.instructions && (
//                     <div className="mt-4 text-sm">
//                       <span className="font-medium">Instructions:</span>{' '}
//                       <span className="text-gray-700">{medication.instructions}</span>
//                     </div>
//                   )}
//                 </div>

//                 <div className="flex space-x-2 ml-4">
//                   <Link
//                     to={`/medications/edit/${medication._id}`}
//                     className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
//                   >
//                     Edit
//                   </Link>
//                   <Link
//                     to={`/medications/${medication._id}`}
//                     className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm font-medium"
//                   >
//                     View
//                   </Link>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Quick Actions with Framer Motion */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         {[
//           {
//             title: 'Adherence Report',
//             description: 'View your medication adherence analytics',
//             icon: FiActivity,
//             color: 'bg-blue-100 text-blue-600',
//             action: () => alert('Mock: Adherence Report')
//           },
//           {
//             title: 'Export Data',
//             description: 'Download reports for your doctor',
//             icon: FiArchive,
//             color: 'bg-green-100 text-green-600',
//             action: () => alert('Mock: Export Data')
//           },
//           {
//             title: 'Set Up Emergency Contacts',
//             description: 'Add contacts for missed dose alerts',
//             icon: FiAlertCircle,
//             color: 'bg-purple-100 text-purple-600',
//             action: () => alert('Mock: Emergency Contacts')
//           }
//         ].map((item, i) => {
//           const Icon = item.icon;
//           return (
//             <motion.button
//               key={i}
//               onClick={item.action}
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: i * 0.1, type: 'spring', stiffness: 80 }}
//               className="flex items-center bg-white border border-gray-200 rounded-lg p-4 text-left hover:shadow-lg transition-all"
//             >
//               <div className={`${item.color} p-3 rounded-lg mr-4`}>
//                 <Icon className="w-6 h-6" />
//               </div>
//               <div>
//                 <h3 className="font-bold text-gray-900">{item.title}</h3>
//                 <p className="text-sm text-gray-600">{item.description}</p>
//               </div>
//             </motion.button>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default Medications;
// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { useMedications } from '../context/MedicationContext';
// import MedicationCard from '../components/medications/MedicationCard';
// import Button from '../components/common/Button';
// import Card from '../components/common/Card';
// import Input from '../components/common/Input';
// import { motion } from 'framer-motion';
// import {
//   FiPlus,
//   FiSearch,
//   FiFilter,
//   FiGrid,
//   FiList,
//   FiActivity,
//   FiArchive,
//   FiAlertCircle,
//   FiRefreshCw
// } from 'react-icons/fi';
// import { GiPill } from 'react-icons/gi';

// const Medications = () => {
//   const { medications, loading, error, fetchMedications, getMedicationStats } = useMedications();

//   const [searchTerm, setSearchTerm] = useState('');
//   const [filter, setFilter] = useState('all');
//   const [viewMode, setViewMode] = useState('grid');
//   const [sortBy, setSortBy] = useState('name');

//   useEffect(() => {
//     fetchMedications();
//   }, []);

//   const stats = getMedicationStats();

//   const filteredMedications = Array.isArray(medications)
//     ? medications
//         .filter(m =>
//           (m?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//             m?.dosage?.toLowerCase().includes(searchTerm.toLowerCase())) &&
//           (filter === 'all' ||
//             (filter === 'active' && m.isActive) ||
//             (filter === 'inactive' && !m.isActive))
//         )
//     : [];

//   /* ===================== UI ===================== */

//   if (loading && filteredMedications.length === 0) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="text-center py-12">
//         <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
//         <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
//           Error Loading Medications
//         </h2>
//         <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
//         <Button variant="primary" onClick={fetchMedications}>
//           Try Again
//         </Button>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
//             <GiPill className="w-8 h-8 mr-3 text-blue-600" />
//             My Medications
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400 mt-2">
//             Manage your medications and reminders
//           </p>
//         </div>

//         <Link to="/medications/add">
//           <Button variant="primary">
//             <FiPlus className="mr-2" />
//             Add Medication
//           </Button>
//         </Link>
//       </div>

//       {/* Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         {[
//           { label: 'Total', value: stats.total, color: 'text-gray-900 dark:text-gray-100' },
//           { label: 'Active', value: stats.active, color: 'text-green-600 dark:text-green-400' },
//           { label: 'Due Today', value: stats.today, color: 'text-blue-600 dark:text-blue-400' },
//           {
//             label: 'Active Rate',
//             value: stats.total ? `${Math.round((stats.active / stats.total) * 100)}%` : '0%',
//             color: 'text-yellow-600 dark:text-yellow-400'
//           }
//         ].map((s, i) => (
//           <Card key={i} className="text-center bg-white dark:bg-gray-900 border dark:border-gray-700">
//             <div className={`text-3xl font-bold ${s.color}`}>{s.value || 0}</div>
//             <div className="text-sm text-gray-600 dark:text-gray-400">{s.label}</div>
//           </Card>
//         ))}
//       </div>

//       {/* Filters */}
//       <Card className="bg-white dark:bg-gray-900 border dark:border-gray-700">
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
//           {/* Search */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//               Search
//             </label>
//             <div className="relative">
//               <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//               <Input
//                 value={searchTerm}
//                 onChange={e => setSearchTerm(e.target.value)}
//                 className="pl-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
//               />
//             </div>
//           </div>

//           {/* Filter */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//               Filter
//             </label>
//             <div className="flex gap-2 flex-wrap">
//               {['all', 'active', 'inactive'].map(f => (
//                 <button
//                   key={f}
//                   onClick={() => setFilter(f)}
//                   className={`px-4 py-2 rounded-lg text-sm font-medium
//                     ${
//                       filter === f
//                         ? 'bg-blue-600 text-white'
//                         : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
//                     }`}
//                 >
//                   {f}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* View */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//               View
//             </label>
//             <div className="flex bg-gray-200 dark:bg-gray-800 rounded-lg p-1">
//               {[FiGrid, FiList].map((Icon, i) => (
//                 <button
//                   key={i}
//                   onClick={() => setViewMode(i === 0 ? 'grid' : 'list')}
//                   className={`p-2 rounded ${
//                     (i === 0 && viewMode === 'grid') ||
//                     (i === 1 && viewMode === 'list')
//                       ? 'bg-white dark:bg-gray-700'
//                       : ''
//                   }`}
//                 >
//                   <Icon className="text-gray-700 dark:text-gray-300" />
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>
//       </Card>

//       {/* Medications */}
//       {viewMode === 'grid' ? (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {filteredMedications.map(m => (
//             <MedicationCard key={m._id} medication={m} />
//           ))}
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {filteredMedications.map(m => (
//             <div
//               key={m._id}
//               className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg p-6"
//             >
//               <h3 className="font-bold text-gray-900 dark:text-gray-100">{m.name}</h3>
//               <p className="text-sm text-gray-600 dark:text-gray-400">
//                 Frequency: {m.frequency} • Dosage: {m.dosage}
//               </p>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Quick Actions */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         {[
//           { title: 'Adherence Report', icon: FiActivity },
//           { title: 'Export Data', icon: FiArchive },
//           { title: 'Emergency Contacts', icon: FiAlertCircle }
//         ].map((item, i) => {
//           const Icon = item.icon;
//           return (
//             <motion.button
//               key={i}
//               whileHover={{ scale: 1.05 }}
//               className="flex items-center bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg p-4 text-left"
//             >
//               <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg mr-4">
//                 <Icon className="text-blue-600 dark:text-blue-300 w-6 h-6" />
//               </div>
//               <div>
//                 <h3 className="font-bold text-gray-900 dark:text-gray-100">
//                   {item.title}
//                 </h3>
//                 <p className="text-sm text-gray-600 dark:text-gray-400">
//                   Click to view
//                 </p>
//               </div>
//             </motion.button>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default Medications;

//  
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMedications } from "../context/MedicationContext";
import MedicationCard from "../components/medications/MedicationCard";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import {
  FiPlus,
  FiSearch,
  FiGrid,
  FiList,
  FiActivity,
  FiArchive,
  FiAlertCircle,
} from "react-icons/fi";
import { GiPill } from "react-icons/gi";
import PageDoodle from "../components/common/PageDoodle";
import { motion } from "framer-motion";

const Medications = () => {
  const { medications, loading, error, fetchMedications, getMedicationStats } =
    useMedications();

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    fetchMedications();
  }, []);

  const stats = getMedicationStats();

  const filteredMedications =
    medications?.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.dosage?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchFilter =
        filter === "all" ||
        (filter === "active" && m.isActive) ||
        (filter === "inactive" && !m.isActive);

      return matchSearch && matchFilter;
    }) || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-10 w-10 rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <FiAlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Failed to load medications
        </h2>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <GiPill className="mr-3 text-blue-600" />
            My Medications
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your medications and reminders
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PageDoodle type="medication" className="hidden lg:block" />
          <Link to="/medications/add">
            <Button variant="primary">
              <FiPlus className="mr-2" />
              Add Medication
            </Button>
          </Link>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 dark:bg-blue-900 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-300">
            {stats.total || 0}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Total
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900 p-6 rounded-xl border border-green-100 dark:border-green-800">
          <div className="text-3xl font-bold text-green-600 dark:text-green-300">
            {stats.active || 0}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Active
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900 p-6 rounded-xl border border-purple-100 dark:border-purple-800">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-300">
            {stats.today || 0}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Due Today
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900 p-6 rounded-xl border border-yellow-100 dark:border-yellow-800">
          <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-300">
            {stats.total
              ? `${Math.round((stats.active / stats.total) * 100)}%`
              : "0%"}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Active Rate
          </p>
        </div>
      </div>

      {/* FILTER BAR */}
      <Card className="bg-white dark:bg-gray-900 border dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4 justify-between">

          {/* Search */}
          <div className="relative w-full md:w-1/2">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Search medications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {["all", "active", "inactive"].map((f) => (
              <Button
                key={f}
                variant={filter === f ? "primary" : "outline"}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "primary" : "outline"}
              onClick={() => setViewMode("grid")}
            >
              <FiGrid />
            </Button>
            <Button
              variant={viewMode === "list" ? "primary" : "outline"}
              onClick={() => setViewMode("list")}
            >
              <FiList />
            </Button>
          </div>

        </div>
      </Card>

      {/* MEDICATION LIST */}
      {filteredMedications.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          No medications found
        </p>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredMedications.map((m) => (
            <MedicationCard key={m._id} medication={m} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMedications.map((m) => (
            <div
              key={m._id}
              className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg p-5"
            >
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {m.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {m.frequency} • {m.dosage}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Medications;
