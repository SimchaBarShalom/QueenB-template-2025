// Calendar-month boundaries in server local time, as a half-open [start, end)
// range so it can be used directly as a Prisma gte/lt filter.
function monthRangeFor(date) {
  const value = new Date(date);

  return {
    start: new Date(value.getFullYear(), value.getMonth(), 1),
    end: new Date(value.getFullYear(), value.getMonth() + 1, 1),
  };
}

function currentMonthRange(now = new Date()) {
  return monthRangeFor(now);
}

module.exports = {
  monthRangeFor,
  currentMonthRange,
};
