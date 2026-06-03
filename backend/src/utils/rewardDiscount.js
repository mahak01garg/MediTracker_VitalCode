const readNumber = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
};

const appointmentDiscountConfig = {
  featureId: 'appointment_discount_voucher',
  minimumPoints: readNumber('APPOINTMENT_DISCOUNT_POINTS', 50),
  basePercent: readNumber('APPOINTMENT_DISCOUNT_PERCENT', 20),
  maxPercent: readNumber('APPOINTMENT_DISCOUNT_MAX_PERCENT', 50),
  stepPoints: readNumber('APPOINTMENT_DISCOUNT_STEP_POINTS', 10),
  stepPercent: readNumber('APPOINTMENT_DISCOUNT_STEP_PERCENT', 2),
};

const clampPercent = (value) => {
  const percent = Number(value);
  if (!Number.isFinite(percent)) return 0;
  return Math.min(Math.max(percent, 0), 100);
};

const getAppointmentDiscountPercentByPoints = (points) => {
  const currentPoints = Math.max(0, Number(points) || 0);
  const {
    minimumPoints,
    basePercent,
    maxPercent,
    stepPoints,
    stepPercent,
  } = appointmentDiscountConfig;

  if (currentPoints < minimumPoints) return 0;

  const extraPercent =
    stepPoints > 0
      ? Math.floor((currentPoints - minimumPoints) / stepPoints) * stepPercent
      : 0;

  return clampPercent(Math.min(basePercent + extraPercent, maxPercent));
};

const getAppointmentDiscountFromReward = (reward) => {
  if (!reward?.metadata) return 0;

  const rawPercent = reward.metadata.discountPercent;
  if (rawPercent != null) return clampPercent(rawPercent);

  return reward.metadata.premiumFeatureId === appointmentDiscountConfig.featureId
    ? clampPercent(appointmentDiscountConfig.basePercent)
    : 0;
};

const getNextAppointmentDiscountTier = (points) => {
  const currentPoints = Math.max(0, Number(points) || 0);
  const {
    minimumPoints,
    maxPercent,
    stepPoints,
  } = appointmentDiscountConfig;
  const currentPercent = getAppointmentDiscountPercentByPoints(currentPoints);

  if (currentPercent >= maxPercent || stepPoints <= 0) return null;

  const nextPoints =
    currentPoints < minimumPoints
      ? minimumPoints
      : currentPoints + (stepPoints - ((currentPoints - minimumPoints) % stepPoints));

  return {
    pointsRequired: nextPoints,
    pointsShort: Math.max(nextPoints - currentPoints, 0),
    discountPercent: getAppointmentDiscountPercentByPoints(nextPoints),
  };
};

module.exports = {
  appointmentDiscountConfig,
  getAppointmentDiscountPercentByPoints,
  getAppointmentDiscountFromReward,
  getNextAppointmentDiscountTier,
};
