import React, { useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiAward,
  FiBarChart2,
  FiCalendar,
  FiCheckCircle,
  FiDownload,
  FiGift,
  FiLock,
  FiRefreshCw,
  FiShield,
  FiZap,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { rewardAPI } from '../api/reward';

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

const PremiumRewards = () => {
  const [pointsData, setPointsData] = useState(null);
  const [premiumData, setPremiumData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unlockingId, setUnlockingId] = useState('');
  const [latestUnlock, setLatestUnlock] = useState(null);

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
                  onClick={() => handleUnlock(feature.id)}
                  disabled={feature.isUnlocked || !feature.canUnlock || unlockingId === feature.id}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {feature.isUnlocked ? (
                    <>
                      <FiCheckCircle className="mr-2 h-4 w-4" />
                      Unlocked
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
    </div>
  );
};

export default PremiumRewards;
