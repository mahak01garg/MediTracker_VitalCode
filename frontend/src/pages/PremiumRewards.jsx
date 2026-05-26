import React, { useEffect, useMemo, useState } from 'react';
import {
  FiCalendar,
  FiCheckCircle,
  FiGift,
  FiLock,
  FiRefreshCw,
  FiTag,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { rewardAPI } from '../api/reward';
import api from '../api/api';

const APPOINTMENT_DISCOUNT_ID = 'appointment_discount_voucher';

const formatAccessUntil = (value) => {
  if (!value) return 'Unlocked';
  return `Until ${new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
};

const formatDateTime = (date, time) => {
  if (!date) return time || 'Date not available';
  const dateText = new Date(date).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return time ? `${dateText} - ${time}` : dateText;
};

const PremiumRewards = () => {
  const [pointsData, setPointsData] = useState(null);
  const [premiumData, setPremiumData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [unlockingId, setUnlockingId] = useState('');
  const [latestUnlock, setLatestUnlock] = useState(null);

  const currentPoints = premiumData?.currentPoints ?? pointsData?.totalPoints ?? 0;
  const discountFeature = useMemo(() => {
    const feature = premiumData?.features?.find((item) => item.id === APPOINTMENT_DISCOUNT_ID);

    return {
      id: APPOINTMENT_DISCOUNT_ID,
      title: feature?.title || 'Doctor Appointment Discount',
      category: feature?.category || 'Appointments',
      description: feature?.description || 'Load the current appointment discount from the rewards API.',
      pointsRequired: feature?.pointsRequired,
      accessType: feature?.accessType || 'One appointment',
      benefit: feature?.benefit || 'Appointment fee discount',
      discountPercent: feature?.discountPercent,
      isUnlocked: Boolean(feature?.isUnlocked),
      unlockedAt: feature?.unlockedAt || null,
      accessUntil: feature?.accessUntil || null,
      canUnlock: Boolean(feature?.canUnlock),
      pointsShort: feature?.pointsShort ?? 0,
    };
  }, [premiumData]);

  const discountLabel =
    typeof discountFeature.discountPercent === 'number'
      ? `${discountFeature.discountPercent}%`
      : '--';
  const pointsRequiredLabel =
    typeof discountFeature.pointsRequired === 'number'
      ? discountFeature.pointsRequired
      : '--';

  const unpaidAppointments = appointments.filter((appointment) => appointment.paymentStatus !== 'paid');

  const fetchAppointments = async () => {
    try {
      setAppointmentsLoading(true);
      const response = await api.get('/appointments/slots/my-appointments');
      const appointmentData = response.data?.data?.appointments || response.data?.data || [];
      setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        error.message ||
        'Failed to load appointments';
      toast.error(message);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const [points, premium] = await Promise.all([
        rewardAPI.getPoints(),
        rewardAPI.getPremiumRewards(),
      ]);
      setPointsData(points);
      setPremiumData(premium);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to load appointment discount';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
    fetchAppointments();
  }, []);

  const handleUnlock = async () => {
    try {
      setUnlockingId(discountFeature.id);
      const result = await rewardAPI.unlockPremiumReward(discountFeature.id);
      setLatestUnlock(result.feature);
      setPremiumData(result.rewards);
      setPointsData((prev) => ({ ...(prev || {}), totalPoints: result.remainingPoints }));
      toast.success(result.message || 'Doctor appointment discount unlocked');
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Failed to unlock appointment discount';
      toast.error(message);
    } finally {
      setUnlockingId('');
    }
  };

  const refreshAll = () => {
    fetchRewards();
    fetchAppointments();
  };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-blue-700 to-emerald-700 p-6 text-white shadow-xl md:p-8">
        <div className="absolute right-6 top-6 hidden h-24 w-24 items-center justify-center rounded-full bg-white/15 md:flex">
          <FiTag className="h-12 w-12" />
        </div>
        <h1 className="relative z-10 mb-2 text-3xl font-extrabold tracking-tight text-white">
          Doctor Appointment Discount
        </h1>
        <p className="relative z-10 max-w-2xl text-blue-50">
          Redeem points for a real discount on your next unpaid doctor appointment.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-emerald-100 bg-white/95 p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Available Points</p>
          <div className="mt-2 flex items-center text-3xl font-extrabold text-emerald-600">
            <FiGift className="mr-3 h-7 w-7" />
            {currentPoints}
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white/95 p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Discount</p>
          <div className="mt-2 flex items-center text-3xl font-extrabold text-blue-600">
            <FiTag className="mr-3 h-7 w-7" />
            {discountLabel}
          </div>
        </div>

        <button
          type="button"
          onClick={refreshAll}
          disabled={loading || appointmentsLoading}
          className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white/95 p-5 font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
        >
          <FiRefreshCw className={`mr-2 h-5 w-5 ${loading || appointmentsLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {latestUnlock && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 shadow-sm dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
          <div className="flex items-start gap-3">
            <FiCheckCircle className="mt-1 h-6 w-6 flex-none" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide">Unlocked</p>
              <p className="mt-1 text-xl font-extrabold">{latestUnlock.title}</p>
              <p className="text-sm">
                {latestUnlock.benefit} - {formatAccessUntil(latestUnlock.accessUntil)}
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-500" />
        </div>
      ) : (
        <div className="rounded-2xl border bg-white/95 p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                {discountFeature.category} - {discountFeature.accessType}
              </p>
              <h2 className="mt-1 text-2xl font-extrabold text-gray-900 dark:text-white">
                {discountFeature.title}
              </h2>
            </div>
            <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
              <FiCalendar className="h-6 w-6" />
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300">
            {discountFeature.description}
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 text-sm text-gray-700 dark:text-gray-300 md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-gray-900">
              <span className="block text-gray-500 dark:text-gray-400">Points needed</span>
              <span className="mt-1 block text-2xl font-extrabold text-emerald-600">{pointsRequiredLabel}</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-gray-900">
              <span className="block text-gray-500 dark:text-gray-400">Status</span>
              <span className="mt-1 block text-lg font-extrabold text-gray-900 dark:text-white">
                {discountFeature.isUnlocked ? formatAccessUntil(discountFeature.accessUntil) : 'Locked'}
              </span>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-gray-900">
              <span className="block text-gray-500 dark:text-gray-400">Unpaid appointments</span>
              <span className="mt-1 block text-2xl font-extrabold text-blue-600">{unpaidAppointments.length}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {!discountFeature.isUnlocked ? (
              <button
                type="button"
                onClick={handleUnlock}
                disabled={!discountFeature.canUnlock || unlockingId === discountFeature.id}
                className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {unlockingId === discountFeature.id ? (
                  'Unlocking...'
                ) : discountFeature.canUnlock ? (
                  'Unlock Appointment Discount'
                ) : (
                  <>
                    <FiLock className="mr-2 h-4 w-4" />
                    Need {discountFeature.pointsShort} More Points
                  </>
                )}
              </button>
            ) : (
              <Link
                to="/appointments/my-appointments"
                className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white transition hover:bg-emerald-700"
              >
                <FiCheckCircle className="mr-2 h-4 w-4" />
                Go To Appointments
              </Link>
            )}
          </div>
        </div>
      )}

      {discountFeature.isUnlocked && (
        <div className="rounded-2xl border border-emerald-100 bg-white/95 p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Eligible Appointments</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            The backend applies this discount automatically when you click Pay Now for an unpaid appointment.
          </p>

          {appointmentsLoading ? (
            <div className="mt-5 h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-gray-900" />
          ) : unpaidAppointments.length > 0 ? (
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              {unpaidAppointments.slice(0, 4).map((appointment) => (
                <div key={appointment._id} className="rounded-xl bg-emerald-50 p-4 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100">
                  <p className="font-bold">
                    {appointment.doctorId?.name ? `Dr. ${appointment.doctorId.name}` : 'Doctor appointment'}
                  </p>
                  <p className="mt-1 text-sm">{formatDateTime(appointment.date, appointment.time)}</p>
                  <p className="mt-1 text-sm">Fee: {appointment.fee}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-gray-600 dark:bg-gray-900 dark:text-gray-300">
              No unpaid appointment is available on your account right now.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PremiumRewards;
