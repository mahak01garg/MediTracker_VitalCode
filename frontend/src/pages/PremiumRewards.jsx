import React, { useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiAward,
  FiBarChart2,
  FiCalendar,
  FiCheckCircle,
  FiDownload,
  FiExternalLink,
  FiFileText,
  FiGift,
  FiLock,
  FiPrinter,
  FiRefreshCw,
  FiShield,
  FiZap,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { rewardAPI } from '../api/reward';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

const iconMap = {
  Analytics: FiBarChart2,
  AI: FiZap,
  Reports: FiDownload,
  Safety: FiShield,
  Appointments: FiCalendar,
};

const formatAccessUntil = (value) => {
  if (!value) return 'Unlocked';
  return `Until ${new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
};

const fallbackFeatures = [
  {
    id: 'advanced_analytics_7d',
    title: 'Advanced Analytics Plus',
    category: 'Analytics',
    description: 'Unlock deeper adherence trends, consistency score, and medication pattern insights for 7 days.',
    pointsRequired: 10,
    accessType: '7 days',
    benefit: 'Advanced charts and insights',
  },
  {
    id: 'ai_health_insights_7d',
    title: 'AI Health Insights Plus',
    category: 'AI',
    description: 'Unlock personalized weekly health suggestions, missed-dose pattern notes, and doctor visit prompts.',
    pointsRequired: 20,
    accessType: '7 days',
    benefit: 'Premium AI guidance',
  },
  {
    id: 'health_report_export',
    title: 'Health Report Export',
    category: 'Reports',
    description: 'Unlock one downloadable health report with medication history and adherence summary.',
    pointsRequired: 20,
    accessType: 'One report',
    benefit: 'PDF health report',
  },
  {
    id: 'emergency_card_lifetime',
    title: 'Emergency Medical Card',
    category: 'Safety',
    description: 'Unlock a shareable emergency card with medicines, allergies, and contact details.',
    pointsRequired: 40,
    accessType: 'Lifetime',
    benefit: 'Shareable emergency card',
  },
  {
    id: 'appointment_discount_voucher',
    title: 'Appointment Discount Voucher',
    category: 'Appointments',
    description: 'Unlock a voucher that can be applied to your next appointment fee.',
    pointsRequired: 50,
    accessType: 'One appointment',
    benefit: 'Appointment fee discount',
  },
];

const formatDateTime = (value) => {
  if (!value) return 'Not available';
  return new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const PremiumRewards = () => {
  const { user } = useAuth();
  const [pointsData, setPointsData] = useState(null);
  const [premiumData, setPremiumData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unlockingId, setUnlockingId] = useState('');
  const [latestUnlock, setLatestUnlock] = useState(null);
  const [activeFeatureId, setActiveFeatureId] = useState('');
  const [featureLoading, setFeatureLoading] = useState('');
  const [featureData, setFeatureData] = useState({});

  const currentPoints = premiumData?.currentPoints ?? pointsData?.totalPoints ?? 0;
  const features = useMemo(() => {
    const source = premiumData?.features?.length ? premiumData.features : fallbackFeatures;
    return source
      .map((feature) => ({
        ...feature,
        isUnlocked: Boolean(feature.isUnlocked),
        canUnlock: feature.canUnlock ?? currentPoints >= feature.pointsRequired,
        pointsShort: feature.pointsShort ?? Math.max(feature.pointsRequired - currentPoints, 0),
      }))
      .sort((a, b) => a.pointsRequired - b.pointsRequired);
  }, [currentPoints, premiumData]);

  const unlockableCount = features.filter((feature) => feature.canUnlock && !feature.isUnlocked).length;
  const unlockedCount = features.filter((feature) => feature.isUnlocked).length;
  const activeFeature = features.find((feature) => feature.id === activeFeatureId);

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
        'Failed to load premium rewards';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const handleUnlock = async (featureId) => {
    try {
      setUnlockingId(featureId);
      const result = await rewardAPI.unlockPremiumReward(featureId);
      setLatestUnlock(result.feature);
      setPremiumData(result.rewards);
      setPointsData((prev) => ({ ...(prev || {}), totalPoints: result.remainingPoints }));
      toast.success(result.message || 'Premium feature unlocked');
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Failed to unlock premium feature';
      toast.error(message);
    } finally {
      setUnlockingId('');
    }
  };

  const downloadFile = (filename, content, type = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const loadFeature = async (feature) => {
    if (!feature?.isUnlocked) return;

    setActiveFeatureId(feature.id);
    if (featureData[feature.id]) return;

    try {
      setFeatureLoading(feature.id);

      if (feature.id === 'advanced_analytics_7d') {
        const [medicationsRes, reportRes] = await Promise.all([
          api.get('/medications'),
          api.get('/schedule/reports/daily'),
        ]);
        const medications = Array.isArray(medicationsRes.data) ? medicationsRes.data : [];
        const report = reportRes.data?.report || {};
        const totalDoses = Number(report.totalDoses || 0);
        const taken = Number(report.taken || 0);
        const missed = Number(report.missed || 0);
        const pending = Number(report.pending || 0);
        const adherenceRate = totalDoses ? Math.round((taken / totalDoses) * 100) : 0;

        setFeatureData((prev) => ({
          ...prev,
          [feature.id]: {
            activeMedications: medications.filter((item) => item.isActive).length,
            totalMedications: medications.length,
            totalDoses,
            taken,
            missed,
            pending,
            adherenceRate,
            scheduleLoad: medications.reduce(
              (sum, item) =>
                sum +
                (item.schedule || []).reduce((count, schedule) => count + (schedule.times?.length || 0), 0),
              0
            ),
            generatedAt: new Date().toISOString(),
          },
        }));
      }

      if (feature.id === 'ai_health_insights_7d') {
        const [weekRes, pointsRes] = await Promise.all([
          api.get('/ai/summary/week'),
          rewardAPI.getPoints(),
        ]);
        setFeatureData((prev) => ({
          ...prev,
          [feature.id]: {
            summary: weekRes.data?.summary || '',
            predictions: weekRes.data?.predictions || weekRes.data?.insights || [],
            streak: pointsRes?.streak || 0,
            badges: pointsRes?.badges?.length || 0,
            generatedAt: new Date().toISOString(),
          },
        }));
      }

      if (feature.id === 'health_report_export') {
        const [medicationsRes, reportRes, pointsRes] = await Promise.all([
          api.get('/medications'),
          api.get('/schedule/reports/daily'),
          rewardAPI.getPoints(),
        ]);
        const medications = Array.isArray(medicationsRes.data) ? medicationsRes.data : [];
        const report = reportRes.data?.report || {};
        setFeatureData((prev) => ({
          ...prev,
          [feature.id]: {
            medications,
            report,
            points: pointsRes?.totalPoints || 0,
            generatedAt: new Date().toISOString(),
          },
        }));
      }

      if (feature.id === 'emergency_card_lifetime') {
        const medicationsRes = await api.get('/medications');
        const medications = Array.isArray(medicationsRes.data) ? medicationsRes.data : [];
        setFeatureData((prev) => ({
          ...prev,
          [feature.id]: {
            user,
            medications: medications.filter((item) => item.isActive),
            generatedAt: new Date().toISOString(),
          },
        }));
      }

      if (feature.id === 'appointment_discount_voucher') {
        const appointmentsRes = await api.get('/appointments/slots/my-appointments');
        const appointments =
          appointmentsRes.data?.data?.appointments ||
          appointmentsRes.data?.data ||
          [];
        const unpaidAppointments = appointments.filter((appointment) => appointment.paymentStatus !== 'paid');
        setFeatureData((prev) => ({
          ...prev,
          [feature.id]: {
            appointments,
            unpaidAppointments,
            discountPercent: feature.discountPercent || 20,
            validUntil: feature.accessUntil,
            generatedAt: new Date().toISOString(),
          },
        }));
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to load premium feature';
      toast.error(message);
    } finally {
      setFeatureLoading('');
    }
  };

  const downloadHealthReport = () => {
    const data = featureData.health_report_export;
    if (!data) return;

    const medicationRows = data.medications
      .map((item) => `- ${item.name} (${item.dosage}) | ${item.frequency} | ${item.isActive ? 'Active' : 'Inactive'}`)
      .join('\n');

    const content = [
      'MediTracker Premium Health Report',
      `Patient: ${user?.name || 'Patient'}`,
      `Email: ${user?.email || 'Not available'}`,
      `Generated: ${formatDateTime(data.generatedAt)}`,
      '',
      'Daily Adherence',
      `Summary: ${data.report.summary || 'No daily report summary returned for this account'}`,
      `Total doses: ${data.report.totalDoses || 0}`,
      `Taken: ${data.report.taken || 0}`,
      `Missed: ${data.report.missed || 0}`,
      `Pending: ${data.report.pending || 0}`,
      `Adherence rate: ${data.report.adherenceRate || '0%'}`,
      '',
      'Medications',
      medicationRows || 'No medications found',
    ].join('\n');

    downloadFile(`meditracker-health-report-${Date.now()}.txt`, content);
    toast.success('Health report downloaded');
  };

  const printEmergencyCard = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-blue-700 to-emerald-700 p-6 text-white shadow-xl md:p-8">
        <div className="absolute right-6 top-6 hidden h-24 w-24 items-center justify-center rounded-full bg-white/15 md:flex">
          <FiAward className="h-12 w-12" />
        </div>
        <h1 className="relative z-10 mb-2 text-3xl font-extrabold tracking-tight text-white">
          Premium Rewards
        </h1>
        <p className="relative z-10 max-w-2xl text-blue-50">
          Use reward points to unlock premium tools inside MediTracker.
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
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Ready To Unlock</p>
          <div className="mt-2 flex items-center text-3xl font-extrabold text-blue-600">
            <FiActivity className="mr-3 h-7 w-7" />
            {unlockableCount}
          </div>
        </div>
        <button
          type="button"
          onClick={fetchRewards}
          disabled={loading}
          className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white/95 p-5 font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
        >
          <FiRefreshCw className={`mr-2 h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Rewards
        </button>
      </div>

      {latestUnlock && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 shadow-sm dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
          <div className="flex items-start gap-3">
            <FiCheckCircle className="mt-1 h-6 w-6 flex-none" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide">Unlocked</p>
              <p className="mt-1 text-xl font-extrabold">{latestUnlock.title}</p>
              <p className="text-sm">{latestUnlock.benefit} · {formatAccessUntil(latestUnlock.accessUntil)}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = iconMap[feature.category] || FiAward;
            return (
              <div
                key={feature.id}
                className={`rounded-2xl border bg-white/95 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-gray-800 ${
                  feature.isUnlocked
                    ? 'border-emerald-200 dark:border-emerald-900'
                    : feature.canUnlock
                    ? 'border-blue-200 dark:border-blue-900'
                    : 'border-gray-200 opacity-90 dark:border-gray-700'
                }`}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                      {feature.category} - {feature.accessType}
                    </p>
                    <h3 className="mt-1 text-xl font-extrabold text-gray-900 dark:text-white">
                      {feature.title}
                    </h3>
                  </div>
                  <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>

                <p className="min-h-[72px] text-sm text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>

                <div className="mt-5 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-center justify-between">
                    <span>Unlocks</span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-300">{feature.benefit}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Points needed</span>
                    <span className="font-extrabold text-emerald-600">{feature.pointsRequired}</span>
                  </div>
                  {feature.isUnlocked ? (
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      <span className="font-extrabold text-emerald-600">{formatAccessUntil(feature.accessUntil)}</span>
                    </div>
                  ) : !feature.canUnlock ? (
                    <div className="flex items-center justify-between">
                      <span>More points needed</span>
                      <span className="font-extrabold text-orange-600">{feature.pointsShort}</span>
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => (feature.isUnlocked ? loadFeature(feature) : handleUnlock(feature.id))}
                  disabled={(!feature.isUnlocked && !feature.canUnlock) || unlockingId === feature.id || featureLoading === feature.id}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {feature.isUnlocked ? (
                    <>
                      <FiExternalLink className="mr-2 h-4 w-4" />
                      {featureLoading === feature.id ? 'Opening...' : 'Use Feature'}
                    </>
                  ) : unlockingId === feature.id ? (
                    'Unlocking...'
                  ) : feature.canUnlock ? (
                    'Unlock With Points'
                  ) : (
                    <>
                      <FiLock className="mr-2 h-4 w-4" />
                      Need {feature.pointsShort} More Points
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {unlockedCount > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Unlocked Premium Features</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {features
              .filter((feature) => feature.isUnlocked)
              .map((feature) => (
                <div
                  key={`unlocked-${feature.id}`}
                  className="flex items-center justify-between rounded-xl bg-emerald-50 p-4 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
                >
                  <div>
                    <p className="font-bold">{feature.title}</p>
                    <p className="text-sm">{formatAccessUntil(feature.accessUntil)}</p>
                  </div>
                  <FiCheckCircle className="h-5 w-5" />
                </div>
              ))}
          </div>
        </div>
      )}

      {activeFeature && (
        <div className="rounded-2xl border border-indigo-100 bg-white/95 p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">Premium Tool</p>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">{activeFeature.title}</h2>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
              {formatAccessUntil(activeFeature.accessUntil)}
            </span>
          </div>

          {activeFeature.id === 'advanced_analytics_7d' && featureData[activeFeature.id] && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {[
                ['Adherence', `${featureData[activeFeature.id].adherenceRate}%`],
                ['Taken Today', featureData[activeFeature.id].taken],
                ['Missed Today', featureData[activeFeature.id].missed],
                ['Daily Schedule Load', featureData[activeFeature.id].scheduleLoad],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-4 dark:bg-gray-900">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                  <p className="mt-2 text-2xl font-extrabold text-gray-900 dark:text-white">{value}</p>
                </div>
              ))}
            </div>
          )}

          {activeFeature.id === 'ai_health_insights_7d' && featureData[activeFeature.id] && (
            <div className="space-y-4">
              <div className="rounded-xl bg-indigo-50 p-4 text-indigo-950 dark:bg-indigo-950 dark:text-indigo-100">
                <p className="font-bold">Weekly AI Insight</p>
                <p className="mt-2 whitespace-pre-line text-sm">
                  {featureData[activeFeature.id].summary || 'No weekly AI summary was returned for your account yet.'}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-gray-900">
                  <p className="text-sm text-gray-500">Current streak</p>
                  <p className="text-2xl font-extrabold">{featureData[activeFeature.id].streak} days</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-gray-900">
                  <p className="text-sm text-gray-500">Badges earned</p>
                  <p className="text-2xl font-extrabold">{featureData[activeFeature.id].badges}</p>
                </div>
              </div>
            </div>
          )}

          {activeFeature.id === 'health_report_export' && featureData[activeFeature.id] && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 p-4 dark:bg-gray-900">
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Report ready</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Includes medication list, daily adherence, and reward point summary.
                </p>
              </div>
              <button
                type="button"
                onClick={downloadHealthReport}
                className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700"
              >
                <FiFileText className="mr-2 h-4 w-4" />
                Download Report
              </button>
            </div>
          )}

          {activeFeature.id === 'emergency_card_lifetime' && featureData[activeFeature.id] && (
            <div className="space-y-4">
              <div className="print:shadow-none rounded-xl border border-red-100 bg-red-50 p-5 text-red-950 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
                <p className="text-sm font-bold uppercase tracking-wide">Emergency Medical Card</p>
                <h3 className="mt-1 text-2xl font-extrabold">{user?.name || 'Patient'}</h3>
                <p className="mt-2">Phone: {user?.phone || 'Not added'}</p>
                <p>Emergency contact: {user?.emergencyContact?.phone || user?.emergencyContact || 'Not added'}</p>
                <div className="mt-4">
                  <p className="font-bold">Active medicines</p>
                  <p className="text-sm">
                    {featureData[activeFeature.id].medications
                      .map((item) => `${item.name} ${item.dosage}`)
                      .join(', ') || 'No active medicines listed'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={printEmergencyCard}
                className="inline-flex items-center rounded-xl bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700"
              >
                <FiPrinter className="mr-2 h-4 w-4" />
                Print Card
              </button>
            </div>
          )}

          {activeFeature.id === 'appointment_discount_voucher' && featureData[activeFeature.id] && (
            <div className="rounded-xl bg-emerald-50 p-5 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100">
              <p className="font-bold">Appointment discount is active</p>
              <p className="mt-2 text-sm">
                A {featureData[activeFeature.id].discountPercent}% discount will be applied by the backend when you start payment for your next unpaid appointment.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-white p-4 dark:bg-gray-900">
                  <p className="text-sm">Total appointments</p>
                  <p className="text-2xl font-extrabold">{featureData[activeFeature.id].appointments.length}</p>
                </div>
                <div className="rounded-xl bg-white p-4 dark:bg-gray-900">
                  <p className="text-sm">Eligible unpaid appointments</p>
                  <p className="text-2xl font-extrabold">{featureData[activeFeature.id].unpaidAppointments.length}</p>
                </div>
              </div>
              {featureData[activeFeature.id].unpaidAppointments.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {featureData[activeFeature.id].unpaidAppointments.slice(0, 3).map((appointment) => (
                    <div key={appointment._id} className="rounded-xl bg-white p-3 text-sm dark:bg-gray-900">
                      <p className="font-bold">
                        {appointment.doctorId?.name ? `Dr. ${appointment.doctorId.name}` : 'Appointment'}
                      </p>
                      <p>{formatDateTime(appointment.date)} {appointment.time ? `- ${appointment.time}` : ''}</p>
                      <p>Fee: {appointment.fee}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm">No unpaid appointment is available on your account right now.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PremiumRewards;
