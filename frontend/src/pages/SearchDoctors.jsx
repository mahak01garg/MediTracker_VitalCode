import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { FiSearch, FiBook } from 'react-icons/fi';
import { GiStethoscope } from 'react-icons/gi';
import toast from 'react-hot-toast';
import PageDoodle from '../components/common/PageDoodle';

const formatDoctorName = (name = '') => String(name).replace(/^\s*dr\.?\s*/i, '').trim();

const SearchDoctors = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, [searchTerm, specialization, experience]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (specialization) params.append('specialization', specialization);
      if (experience) params.append('experience', experience);

      const response = await api.get(`/appointments/doctors?${params}`);
      setDoctors(response.data.data?.doctors || response.data.data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        error.message ||
        'Failed to fetch doctors';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = (doctorId) => {
    navigate(`/appointments/book/${doctorId}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative rounded-2xl p-6 md:p-8 bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-xl overflow-hidden">
        <PageDoodle type="doctor" className="absolute right-4 top-4 hidden md:block" />
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          Find a Doctor
        </h1>
        <p className="text-blue-100">
          Search and book appointments with our network of doctors
        </p>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/90 dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-gray-700">
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <input
            type="text"
            placeholder="Specialization (e.g., Cardiology)"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <input
            type="number"
            placeholder="Min Experience (years)"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Doctors List */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-orange-50 dark:bg-gray-800 border border-orange-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No doctors found. Try adjusting your search criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {doctors.map((doctor) => (
            <div
              key={doctor._id}
              className="bg-white/95 dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-6">
                {/* Doctor Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {formatDoctorName(doctor.name)?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Dr. {formatDoctorName(doctor.name)}
                      </h3>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        {doctor.specialization}
                      </p>
                    </div>
                  </div>
                  {doctor.verified && (
                    <div className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-semibold">
                      Verified
                    </div>
                  )}
                </div>

                {/* Doctor Details */}
                <div className="space-y-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <GiStethoscope className="w-4 h-4 mr-2 text-blue-500" />
                    <span>{doctor.experience} years experience</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Degree:
                    </span>
                    <span className="ml-2">{doctor.degree}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <span className="text-gray-600 dark:text-gray-400">{doctor.email}</span>
                  </div>
                </div>

                {/* Book Button */}
                <button
                  onClick={() => handleBookAppointment(doctor._id)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center"
                >
                  <FiBook className="w-4 h-4 mr-2" />
                  Book Appointment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchDoctors;
