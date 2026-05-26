import React, { useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiCopy, FiExternalLink, FiGift, FiLock, FiRefreshCw, FiShoppingBag, FiTag } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { rewardAPI } from '../api/reward';

const formatDate = (value) => {
  if (!value) return 'Limited time';
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const MedicineDiscounts = () => {
  const [pointsData, setPointsData] = useState(null);
  const [offersData, setOffersData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [redeemingId, setRedeemingId] = useState('');
  const [latestRedemption, setLatestRedemption] = useState(null);

  const currentPoints = offersData?.currentPoints ?? pointsData?.totalPoints ?? 0;
  const offers = offersData?.allOffers || offersData?.availableOffers || [];
  const redeemableOfferCount = offersData?.affordableOffers ?? offers.filter((offer) => offer.canRedeem).length;
  const redeemedOffers = offersData?.redeemedOffers || [];

  const redeemedCodes = useMemo(
    () =>
      redeemedOffers
        .map((reward) => reward.partnerOffer)
        .filter((offer) => offer?.discountCode),
    [redeemedOffers]
  );

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const [points, offersResponse] = await Promise.all([
        rewardAPI.getPoints(),
        rewardAPI.getOffers(),
      ]);
      setPointsData(points);
      setOffersData(offersResponse);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to load medicine discounts';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const handleRedeem = async (offerId) => {
    try {
      setRedeemingId(offerId);
      const result = await rewardAPI.redeemOffer(offerId);
      setLatestRedemption(result.offer);
      toast.success('Discount code generated');
      await fetchRewards();
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Failed to redeem offer';
      toast.error(message);
    } finally {
      setRedeemingId('');
    }
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Code copied');
    } catch {
      toast.error('Could not copy code');
    }
  };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 p-6 text-white shadow-xl md:p-8">
        <div className="absolute right-6 top-6 hidden h-24 w-24 items-center justify-center rounded-full bg-white/15 md:flex">
          <FiGift className="h-12 w-12" />
        </div>
        <h1 className="relative z-10 mb-2 text-3xl font-extrabold tracking-tight text-white">
          Medicine Discounts
        </h1>
        <p className="relative z-10 max-w-2xl text-cyan-50">
          Redeem adherence reward points for medicine and health product discount codes.
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
        <div className="rounded-2xl border border-cyan-100 bg-white/95 p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Redeemable Offers</p>
          <div className="mt-2 flex items-center text-3xl font-extrabold text-cyan-600">
            <FiTag className="mr-3 h-7 w-7" />
            {redeemableOfferCount}
          </div>
        </div>
        <button
          type="button"
          onClick={fetchRewards}
          disabled={loading}
          className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white/95 p-5 font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
        >
          <FiRefreshCw className={`mr-2 h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Offers
        </button>
      </div>

      {latestRedemption?.discountCode && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 shadow-sm dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide">Latest Discount Code</p>
              <p className="mt-1 text-xl font-extrabold">{latestRedemption.title}</p>
              <p className="text-sm">{latestRedemption.partner}</p>
              {latestRedemption.website && (
                <p className="text-sm font-semibold">{latestRedemption.website}</p>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => copyCode(latestRedemption.discountCode)}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 font-mono text-lg font-extrabold text-white transition hover:bg-emerald-700"
              >
                {latestRedemption.discountCode}
                <FiCopy className="ml-3 h-5 w-5" />
              </button>
              {latestRedemption.websiteUrl && (
                <a
                  href={latestRedemption.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border border-emerald-300 px-4 py-3 font-bold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-100 dark:hover:bg-emerald-900"
                >
                  Open Website
                  <FiExternalLink className="ml-2 h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-500" />
        </div>
      ) : offers.length === 0 ? (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-8 text-center text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          No medicine discount offers are available right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className={`rounded-2xl border bg-white/95 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-gray-800 ${
                offer.canRedeem
                  ? 'border-emerald-200 dark:border-emerald-900'
                  : 'border-gray-200 opacity-90 dark:border-gray-700'
              }`}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                    {offer.partner} · {offer.website}
                  </p>
                  <h3 className="mt-1 text-xl font-extrabold text-gray-900 dark:text-white">
                    {offer.title}
                  </h3>
                </div>
                <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                  <FiShoppingBag className="h-6 w-6" />
                </div>
              </div>

              <p className="min-h-[48px] text-sm text-gray-600 dark:text-gray-300">
                {offer.description}
              </p>

              <div className="mt-5 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center justify-between">
                  <span>Discount</span>
                  <span className="font-extrabold text-cyan-600 dark:text-cyan-300">{offer.discountLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Points needed</span>
                  <span className="font-extrabold text-emerald-600">{offer.pointsRequired}</span>
                </div>
                {!offer.canRedeem && (
                  <div className="flex items-center justify-between">
                    <span>More points needed</span>
                    <span className="font-extrabold text-orange-600">{offer.pointsShort}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>Valid until</span>
                  <span className="font-semibold">{formatDate(offer.validUntil)}</span>
                </div>
              </div>

              {offer.websiteUrl && (
                <a
                  href={offer.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center text-sm font-bold text-cyan-700 hover:text-cyan-800 dark:text-cyan-300"
                >
                  Use on {offer.website}
                  <FiExternalLink className="ml-1 h-4 w-4" />
                </a>
              )}

              <button
                type="button"
                onClick={() => handleRedeem(offer.id)}
                disabled={!offer.canRedeem || redeemingId === offer.id}
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {!offer.canRedeem && <FiLock className="mr-2 h-4 w-4" />}
                {redeemingId === offer.id
                  ? 'Generating Code...'
                  : offer.canRedeem
                  ? 'Redeem Discount'
                  : `Need ${offer.pointsShort} More Points`}
              </button>
            </div>
          ))}
        </div>
      )}

      {redeemedCodes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Redeemed Codes</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {redeemedCodes.map((offer) => (
              <div
                key={`${offer.partnerId}-${offer.discountCode}`}
                className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white/95 p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                    <FiCheckCircle className="mr-2 h-4 w-4" />
                    {offer.partnerName}
                  </div>
                  <p className="mt-1 font-mono text-lg font-extrabold text-gray-900 dark:text-white">
                    {offer.discountCode}
                  </p>
                  {offer.website && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{offer.website}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copyCode(offer.discountCode)}
                    className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700"
                  >
                    <FiCopy className="mr-2 h-4 w-4" />
                    Copy
                  </button>
                  {offer.websiteUrl && (
                    <a
                      href={offer.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700"
                    >
                      Open
                      <FiExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineDiscounts;
