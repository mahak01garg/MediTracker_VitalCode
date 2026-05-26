const DEFAULT_TIME_ZONE = 'Asia/Kolkata';

const getTimeZone = (value) => {
  const timeZone = String(value || DEFAULT_TIME_ZONE).trim();

  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return timeZone;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
};

const getRequestTimeZone = (req) =>
  getTimeZone(req.query?.tz || req.headers['x-timezone'] || req.body?.timeZone);

const getZonedParts = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: getTimeZone(timeZone),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  }).formatToParts(date);

  const values = parts.reduce((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = Number(part.value);
    return acc;
  }, {});

  if (values.hour === 24) values.hour = 0;

  return values;
};

const getTimeZoneOffsetMs = (date, timeZone) => {
  const parts = getZonedParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return asUtc - date.getTime();
};

const zonedTimeToUtc = (year, monthIndex, day, hour, minute, timeZone) => {
  const utcGuess = new Date(Date.UTC(year, monthIndex, day, hour, minute, 0, 0));
  const firstOffset = getTimeZoneOffsetMs(utcGuess, timeZone);
  const firstUtc = new Date(utcGuess.getTime() - firstOffset);
  const secondOffset = getTimeZoneOffsetMs(firstUtc, timeZone);

  return new Date(utcGuess.getTime() - secondOffset);
};

const addCalendarDays = (dateParts, days) => {
  const date = new Date(Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day + days));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
};

const getZonedDayRange = (date = new Date(), timeZone = DEFAULT_TIME_ZONE) => {
  const zone = getTimeZone(timeZone);
  const parts = getZonedParts(date, zone);
  const start = zonedTimeToUtc(parts.year, parts.month - 1, parts.day, 0, 0, zone);
  const nextDay = addCalendarDays(parts, 1);
  const end = zonedTimeToUtc(nextDay.year, nextDay.month - 1, nextDay.day, 0, 0, zone);

  return { start, end, parts, timeZone: zone };
};

const getCalendarDayIndex = ({ year, month, day }) =>
  new Date(Date.UTC(year, month - 1, day)).getUTCDay();

module.exports = {
  DEFAULT_TIME_ZONE,
  addCalendarDays,
  getCalendarDayIndex,
  getRequestTimeZone,
  getTimeZone,
  getZonedDayRange,
  getZonedParts,
  zonedTimeToUtc,
};
