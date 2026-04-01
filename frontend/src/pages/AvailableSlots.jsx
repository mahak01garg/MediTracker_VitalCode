import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiClock, FiBook } from 'react-icons/fi';
import api from '../api/api';
import toast from 'react-hot-toast';
import PageDoodle from '../components/common/PageDoodle';

const getToday = () => new Date().toISOString().split('T')[0];
const formatDoctorName = (name = '') => String(name).replace(/^\s*dr\.?\s*/i, '').trim();

const AvailableSlots = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [loading, setLoading] = useState(false);
  const [doctorSlots, setDoctorSlots] = useState([]);

  useEffect(() => {
    fetchFreeSlots();
  }, [selectedDate]);

  const fetchFreeSlots = async () => {
    try {
      setLoading(true);
      const doctorsResponse = await api.get('/appointments/doctors');
      const doctors = doctorsResponse.data?.data?.doctors || [];

      const slotResponses = await Promise.all(
        doctors.map(async (doctor) => {
          try {
            const scheduleResponse = await api.get(
              `/appointments/schedule?doctorId=${doctor._id}&date=${selectedDate}`
            );
            const schedule =
              scheduleResponse.data?.data?.schedule || scheduleResponse.data?.schedule;
            const freeSlots = (schedule?.slots || []).filter((slot) => !slot.isBooked);

            return {
              doctor,
              freeSlots,
            };
          } catch {
            return {
              doctor,
              freeSlots: [],
            };
          }
        })
      );

      setDoctorSlots(slotResponses.filter((item) => item.freeSlots.length > 0));
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        error.message ||
        'Failed to load free slots';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const totalFreeSlots = useMemo(
    () => doctorSlots.reduce((count, item) => count + item.freeSlots.length, 0),
    [doctorSlots]
  );

  return (
    <div className="space-y-8">
      <div className="relative rounded-2xl p-6 md:p-8 bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-xl overflow-hidden">
        <PageDoodle type="schedule" className="absolute right-4 top-4 hidden md:block" />
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Available Free Slots</h1>
        <p className="text-emerald-100">
          Check only unbooked doctor slots and book instantly
        </p>
      </div>

      <div className="bg-white/95 dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
          <FiClock className="mr-2" />
          Total Free Slots: <span className="font-semibold ml-1">{totalFreeSlots}</span>
        </div>

        <div className="flex items-center gap-2">
          <FiCalendar className="text-gray-500" />
          <input
            type="date"
            min={getToday()}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : doctorSlots.length === 0 ? (
        <div className="bg-orange-50 dark:bg-gray-800 border border-orange-200 dark:border-gray-700 rounded-lg p-8 text-center text-gray-600 dark:text-gray-400">
          No free slots available for this date.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {doctorSlots.map(({ doctor, freeSlots }) => (
            <div
              key={doctor._id}
            className="bg-white/95 dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Dr. {formatDoctorName(doctor.name)}</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400">{doctor.specialization}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
                  {freeSlots.length} free
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {freeSlots.map((slot, idx) => (
                  <span
                    key={`${doctor._id}-${slot.time}-${idx}`}
                    className="px-3 py-1 rounded-md text-sm bg-green-50 text-green-700 border border-green-200 dark:bg-gray-700 dark:text-green-300 dark:border-gray-600"
                  >
                    {slot.time} - ₹{slot.fee}
                  </span>
                ))}
              </div>

              <button
                onClick={() => navigate(`/appointments/book/${doctor._id}`)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center"
              >
                <FiBook className="w-4 h-4 mr-2" />
                Book with Dr. {formatDoctorName(doctor.name).split(' ')[0]}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableSlots;
