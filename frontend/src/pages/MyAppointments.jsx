import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageDoodle from '../components/common/PageDoodle';
import { useAuth } from '../context/AuthContext';

const formatDoctorName = (name = '') => String(name).replace(/^\s*dr\.?\s*/i, '').trim();
const getProfileImage = (person) => person?.profilePicture || person?.avatar || '';
const getInitial = (person, fallback) => (person?.name || fallback || 'U').charAt(0).toUpperCase();

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

const MyAppointments = () => {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [payingId, setPayingId] = useState(null);

  useEffect(() => {
    fetchAppointments();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAppointments, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        isDoctor ? '/appointments/doctors/me/bookings' : '/appointments/slots/my-appointments'
      );
      console.log('Appointments response:', response.data);
      const appointmentsData = response.data.data?.appointments || response.data.data || [];
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      // It's okay if no appointments exist yet
      if (error.response?.status === 404) {
        setAppointments([]);
      } else {
        const message =
          error.response?.data?.message ||
          error.response?.data?.error?.message ||
          error.message ||
          'Failed to load appointments';
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    const confirmed = window.confirm('Are you sure you want to delete this appointment?');
    if (!confirmed) return;

    try {
      await api.delete(`/appointments/slots/${appointmentId}`);
      setAppointments((prev) => prev.filter((apt) => apt._id !== appointmentId));
      toast.success('Appointment deleted successfully');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        error.message ||
        'Failed to delete appointment';
      toast.error(message);
    }
  };

  const handlePayNow = async (appointment) => {
    try {
      setPayingId(appointment._id);
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        toast.error('Razorpay SDK failed to load');
        return;
      }

      const doctorId = appointment.doctorId?._id || appointment.doctorId;
      const scheduleId = appointment.scheduleId?._id || appointment.scheduleId;

      const orderRes = await api.post('/appointments/slots/create-payment-order', {
        doctorId,
        scheduleId,
        slotIndex: appointment.slotIndex,
      });

      const orderData = orderRes.data?.data;
      if (!orderData?.orderId || !orderData?.keyId) {
        toast.error('Could not initialize payment.');
        return;
      }

      const user = (() => {
        try {
          return JSON.parse(localStorage.getItem('user') || '{}');
        } catch {
          return {};
        }
      })();

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'MediTracker',
        description: `Appointment with Dr. ${formatDoctorName(appointment.doctorId?.name || '')}`,
        order_id: orderData.orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#4f46e5',
        },
        handler: async function (paymentResponse) {
          try {
            await api.post('/appointments/slots/verify-payment', {
              requestId: orderData.requestId,
              ...paymentResponse,
            });
            toast.success('Payment successful! Appointment confirmed.');
            fetchAppointments();
          } catch (verifyError) {
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
      console.error('Error in payment:', error);
      toast.error(error.response?.data?.message || 'Failed to start payment');
    } finally {
      setPayingId(null);
    }
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    return paymentStatus === 'paid' ? (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
        Paid
      </span>
    ) : (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
        Pending Payment
      </span>
    );
  };

  const filteredAppointments = appointments;

  if (loading && appointments.length === 0) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative rounded-2xl p-6 md:p-8 bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-xl overflow-hidden">
        <PageDoodle type="appointment" className="absolute right-4 top-4 hidden md:block" />
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          {isDoctor ? 'Patient Bookings' : 'My Appointments'}
        </h1>
        <p className="text-purple-100">
          {isDoctor ? 'View appointments booked with you' : 'View and manage all your scheduled appointments'}
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white/95 dark:bg-gray-800 rounded-2xl p-4 border border-blue-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{appointments.length}</p>
            </div>
            <FiCalendar className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white/95 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center shadow-sm">
          <FiCalendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No appointments found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {isDoctor ? "No patients have booked your slots yet." : "You haven't booked any appointments yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <div
              key={appointment._id}
              className="bg-white/95 dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                {/* Person Info */}
                <div className="flex items-center space-x-3">
                  {getProfileImage(isDoctor ? appointment.patientId : appointment.doctorId) ? (
                    <img
                      src={getProfileImage(isDoctor ? appointment.patientId : appointment.doctorId)}
                      alt={isDoctor ? appointment.patientId?.name || 'Patient' : appointment.doctorId?.name || 'Doctor'}
                      className="h-12 w-12 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {isDoctor ? getInitial(appointment.patientId, 'P') : getInitial(appointment.doctorId, 'D')}
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{isDoctor ? 'Patient' : 'Doctor'}</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {isDoctor ? appointment.patientId?.name || 'N/A' : `Dr. ${formatDoctorName(appointment.doctorId?.name || 'N/A')}`}
                    </p>
                    {isDoctor && appointment.patientId?.email && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{appointment.patientId.email}</p>
                    )}
                  </div>
                </div>

                {/* Date & Time */}
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Date & Time</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {new Date(appointment.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {appointment.time}
                  </p>
                </div>

                {/* Payment & Fee */}
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Payment</p>
                    {getPaymentStatusBadge(appointment.paymentStatus)}
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ₹{appointment.fee}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {!isDoctor && appointment.paymentStatus !== 'paid' && (
                      <button
                        onClick={() => handlePayNow(appointment)}
                        disabled={payingId === appointment._id}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium transition-colors"
                      >
                        {payingId === appointment._id ? 'Opening...' : 'Pay Now'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAppointment(appointment._id)}
                      className="px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
