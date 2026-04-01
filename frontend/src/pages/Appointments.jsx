import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiHome, FiTruck } from 'react-icons/fi';
import { GiStethoscope } from 'react-icons/gi';
import PageDoodle from '../components/common/PageDoodle';
import { useAuth } from '../context/AuthContext';

const Appointments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';

  const appointmentOptions = isDoctor ? [
    {
      id: 'manage-slots',
      title: 'Manage Free Slots',
      description: 'Upload and update your available appointment slots',
      icon: <FiCalendar className="w-8 h-8" />,
      color: 'from-blue-500 to-indigo-600',
      path: '/appointments/manage-slots'
    },
    {
      id: 'my-appointments',
      title: 'Patient Bookings',
      description: 'View appointments booked with you',
      icon: <GiStethoscope className="w-8 h-8" />,
      color: 'from-emerald-500 to-teal-600',
      path: '/appointments/my-appointments'
    }
  ] : [
    {
      id: 'search-doctors',
      title: 'Search Doctors',
      description: 'Find and book appointments with doctors',
      icon: <GiStethoscope className="w-8 h-8" />,
      color: 'from-blue-500 to-blue-600',
      path: '/appointments/search'
    },
    {
      id: 'my-appointments',
      title: 'My Appointments',
      description: 'View and manage your scheduled appointments',
      icon: <FiCalendar className="w-8 h-8" />,
      color: 'from-purple-500 to-purple-600',
      path: '/appointments/my-appointments'
    },
    {
      id: 'available-slots',
      title: 'Available Slots',
      description: 'Check available slots and schedules',
      icon: <FiCalendar className="w-8 h-8" />,
      color: 'from-green-500 to-green-600',
      path: '/appointments/slots'
    },
    {
      id: 'ambulance-booking',
      title: 'Ambulance Booking',
      description: 'Find hospitals and available ambulances instantly',
      icon: <FiTruck className="w-8 h-8" />,
      color: 'from-red-500 to-rose-600',
      path: '/ambulance-booking'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative rounded-2xl p-6 md:p-8 bg-gradient-to-r from-slate-900 to-blue-900 text-white shadow-xl overflow-hidden">
        <PageDoodle type="appointment" className="absolute right-4 top-4 hidden md:block" />
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight text-white">
          Appointments
        </h1>
        <p className="text-blue-100">
          {isDoctor ? 'Manage your schedule and review patient bookings' : 'Book and manage your doctor appointments'}
        </p>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {appointmentOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => navigate(option.path)}
            className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-90 group-hover:opacity-100 transition-opacity`} />

            {/* Content */}
            <div className="relative p-8 text-center text-white h-full flex flex-col items-center justify-center">
              <div className="mb-4 p-4 rounded-full bg-white bg-opacity-20 group-hover:bg-opacity-30 transition-all">
                {option.icon}
              </div>
              <h3 className="text-2xl font-bold mb-2">{option.title}</h3>
              <p className="text-sm text-white text-opacity-90">
                {option.description}
              </p>
              
              {/* Hover Arrow */}
              <div className="mt-4 group-hover:translate-x-1 transition-transform">
                <span className="text-lg">→</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Info */}
      <div className={`grid grid-cols-1 ${isDoctor ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6`}>
        <div className="bg-white/90 dark:bg-gray-800 rounded-2xl p-6 border border-blue-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center mb-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white mr-4">
              <GiStethoscope className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{isDoctor ? 'Your Availability' : 'Expert Doctors'}</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isDoctor ? 'Publish the free slots patients can book.' : 'Browse and select from verified medical professionals'}
          </p>
        </div>

        <div className="bg-white/90 dark:bg-gray-800 rounded-2xl p-6 border border-purple-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center mb-3">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white mr-4">
              <FiCalendar className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{isDoctor ? 'Incoming Bookings' : 'Easy Booking'}</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isDoctor ? 'See who booked with you and when.' : 'Book appointments at your convenience with flexible slots'}
          </p>
        </div>

        {!isDoctor && (
          <div className="bg-white/90 dark:bg-gray-800 rounded-2xl p-6 border border-green-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white mr-4">
                <FiHome className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Manage All</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View and manage all your appointments in one place
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;
