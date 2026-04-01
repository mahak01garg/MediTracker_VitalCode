import React, { useEffect, useMemo, useState } from 'react';
import { FiActivity, FiPhoneCall, FiTruck } from 'react-icons/fi';
import api from '../api/api';
import toast from 'react-hot-toast';

const AmbulanceIllustration = () => (
  <svg viewBox="0 0 360 160" className="w-full max-w-xs" role="img" aria-label="Ambulance illustration">
    <rect x="10" y="110" width="340" height="10" rx="5" fill="rgba(255,255,255,0.35)" />
    <rect x="45" y="54" width="182" height="56" rx="10" fill="#ffffff" />
    <rect x="226" y="68" width="78" height="42" rx="8" fill="#ffffff" />
    <rect x="62" y="65" width="55" height="26" rx="4" fill="#dbeafe" />
    <rect x="121" y="65" width="55" height="26" rx="4" fill="#dbeafe" />
    <rect x="236" y="76" width="32" height="18" rx="4" fill="#dbeafe" />
    <rect x="78" y="48" width="34" height="8" rx="4" fill="#ef4444" />
    <circle cx="95" cy="118" r="18" fill="#0f172a" />
    <circle cx="95" cy="118" r="9" fill="#cbd5e1" />
    <circle cx="258" cy="118" r="18" fill="#0f172a" />
    <circle cx="258" cy="118" r="9" fill="#cbd5e1" />
    <rect x="152" y="76" width="32" height="6" rx="2" fill="#ef4444" />
    <rect x="165" y="63" width="6" height="32" rx="2" fill="#ef4444" />
    <circle cx="316" cy="92" r="10" fill="#f59e0b" />
    <path d="M320 86l-8 12h12z" fill="#fff7ed" />
  </svg>
);

const AmbulanceBooking = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ambulance/hospitals');
      setHospitals(response.data?.data?.hospitals || []);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        error.message ||
        'Failed to load ambulance availability';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const totalAvailable = useMemo(
    () => hospitals.reduce((sum, hospital) => sum + (hospital.availableAmbulances || 0), 0),
    [hospitals]
  );

  return (
    <div className="space-y-8">
      <div className="rounded-2xl p-6 md:p-8 bg-gradient-to-r from-red-700 to-rose-700 text-white shadow-xl overflow-hidden relative">
        <div className="absolute -right-8 -top-5 opacity-80 hidden md:block">
          <AmbulanceIllustration />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-white relative z-10">Ambulance Booking</h1>
        <p className="text-rose-100 relative z-10">Check hospital-wise live ambulance availability</p>
      </div>

      <div className="bg-white/95 dark:bg-gray-800 rounded-2xl p-4 md:p-5 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center text-gray-700 dark:text-gray-200">
          <FiTruck className="mr-2 text-red-600" />
          <span className="font-semibold">Total Available Ambulances:</span>
          <span className="ml-2 text-xl font-extrabold text-red-600">{totalAvailable}</span>
        </div>
        <button
          onClick={fetchHospitals}
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      ) : hospitals.length === 0 ? (
        <div className="bg-orange-50 dark:bg-gray-800 border border-orange-200 dark:border-gray-700 rounded-2xl p-8 text-center text-gray-600 dark:text-gray-400">
          No hospitals available right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hospitals.map((hospital) => (
            <div
              key={hospital.id}
              className="bg-white/95 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{hospital.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{hospital.location}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    hospital.availableAmbulances > 2
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}
                >
                  {hospital.availableAmbulances} Available
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center">
                  <FiActivity className="mr-2 text-red-500" />
                  <span>
                    Ambulances: {hospital.availableAmbulances} / {hospital.totalAmbulances}
                  </span>
                </div>
                <div className="flex items-center">
                  <FiTruck className="mr-2 text-red-500" />
                  <span>Estimated Arrival: {hospital.estimatedArrivalMinutes} mins</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Availability</span>
                    <span>{Math.round((hospital.availableAmbulances / hospital.totalAmbulances) * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-green-400"
                      style={{
                        width: `${Math.max(
                          8,
                          Math.round((hospital.availableAmbulances / hospital.totalAmbulances) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <a
                href={`tel:${hospital.emergencyContact}`}
                className="mt-4 inline-flex items-center justify-center w-full rounded-xl bg-red-600 hover:bg-red-700 text-white py-2.5 font-semibold transition-colors"
              >
                <FiPhoneCall className="mr-2" />
                Call Ambulance Desk
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AmbulanceBooking;
