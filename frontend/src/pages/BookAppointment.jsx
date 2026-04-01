import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { FiCalendar, FiClock, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageDoodle from '../components/common/PageDoodle';

const formatDoctorName = (name = '') => String(name).replace(/^\s*dr\.?\s*/i, '').trim();

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const BookAppointment = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();

  useEffect(() => {
    fetchDoctorDetails();
  }, [doctorId]);

  useEffect(() => {
    if (selectedDate && doctor) {
      fetchSlots();
    }
  }, [selectedDate, doctor]);

  const fetchDoctorDetails = async () => {
    try {
      const response = await api.get(`/appointments/doctors/${doctorId}`);
      setDoctor(response.data.data);
    } catch (error) {
      console.error('Error fetching doctor:', error);
      toast.error('Failed to load doctor details');
    }
  };

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/appointments/schedule?doctorId=${doctorId}&date=${selectedDate}`);
      const scheduleData = response.data.data?.schedule || response.data.schedule;
      setSelectedScheduleId(scheduleData?._id || '');
      setSlots(scheduleData?.slots || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
      // Don't show error if no schedule exists
      setSelectedScheduleId('');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async () => {
    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }

    try {
      setSubmitting(true);
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        toast.error('Razorpay SDK failed to load. Please check your internet and retry.');
        return;
      }

      const response = await api.post('/appointments/slots/create-payment-order', {
        doctorId,
        scheduleId: selectedScheduleId,
        slotIndex: selectedSlot.index
      });

      const orderData = response.data?.data;
      if (!orderData?.orderId || !orderData?.keyId) {
        toast.error('Could not initialize payment.');
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'MediTracker',
        description: `Appointment with Dr. ${formatDoctorName(doctor?.name || '')}`,
        order_id: orderData.orderId,
        prefill: {
          name: currentUser?.name || '',
          email: currentUser?.email || '',
        },
        theme: {
          color: '#0891b2',
        },
        handler: async function (paymentResponse) {
          try {
            await api.post('/appointments/slots/verify-payment', {
              requestId: orderData.requestId,
              ...paymentResponse,
            });

            toast.success('Payment successful! Appointment confirmed.');
            setTimeout(() => navigate('/appointments/my-appointments'), 1500);
          } catch (verifyError) {
            console.error('Payment verification failed:', verifyError);
            toast.error(verifyError.response?.data?.message || 'Payment verification failed');
          }
        },
        modal: {
          ondismiss: function () {
            toast('Payment cancelled');
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (error) {
      console.error('Error booking slot:', error);
      toast.error(error.response?.data?.message || 'Failed to start payment');
    } finally {
      setSubmitting(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/appointments/search')}
        className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 rounded-xl px-3 py-2 bg-white/80 dark:bg-gray-800 border border-slate-200 dark:border-gray-700"
      >
        <FiArrowLeft className="w-5 h-5 mr-2" />
        Back to Doctors
      </button>

      {/* Doctor Info */}
      {doctor && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-blue-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <PageDoodle type="appointment" className="absolute right-4 top-4 hidden md:block" />
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {formatDoctorName(doctor.name)?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Dr. {formatDoctorName(doctor.name)}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{doctor.specialization}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {doctor.experience} years experience
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Date & Slot Selection */}
      <div className="bg-white/95 dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Select Date & Time
        </h3>

        {/* Date Selection */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            <FiCalendar className="inline w-4 h-4 mr-2" />
            Select Date
          </label>
          <input
            type="date"
            min={getMinDate()}
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedSlot(null);
              setSelectedScheduleId('');
            }}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Slots Selection */}
        {selectedDate && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              <FiClock className="inline w-4 h-4 mr-2" />
              Available Time Slots
            </label>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : slots.length === 0 ? (
              <div className="bg-orange-50 dark:bg-gray-700 border border-orange-200 dark:border-gray-600 rounded p-4 text-center text-gray-600 dark:text-gray-400">
                No slots available for this date. Please choose another date.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {slots.map((slot, index) => (
                  <button
                    key={index}
                    disabled={slot.isBooked}
                    onClick={() => {
                      if (!slot.isBooked) {
                        setSelectedSlot({
                          ...slot,
                          index
                        });
                      }
                    }}
                    className={`p-3 rounded-lg font-semibold transition-all text-sm ${
                      slot.isBooked
                        ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : selectedSlot?.index === index
                        ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div>{slot.time}</div>
                    <div className="text-xs mt-1">₹{slot.fee}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Booking Summary */}
        {selectedSlot && (
          <div className="mt-8 p-4 bg-blue-50 dark:bg-gray-700 border border-blue-200 dark:border-gray-600 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Booking Summary
            </h4>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p>
                <span className="font-semibold">Doctor:</span> Dr. {formatDoctorName(doctor?.name)}
              </p>
              <p>
                <span className="font-semibold">Date:</span> {selectedDate}
              </p>
              <p>
                <span className="font-semibold">Time:</span> {selectedSlot.time}
              </p>
              <p>
                <span className="font-semibold">Fee:</span> ₹{selectedSlot.fee}
              </p>
            </div>
          </div>
        )}

        {/* Book Button */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleBookSlot}
            disabled={!selectedSlot || !selectedScheduleId || submitting}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-all"
          >
            {submitting ? 'Preparing Payment...' : `Pay & Confirm ₹${selectedSlot?.fee || 0}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
