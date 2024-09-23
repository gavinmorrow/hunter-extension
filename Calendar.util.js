/**
 * Safe wrapper around JS `Date` for some common util methods.
 */
const Calendar = {
  /**
   * @param {Date} date
   * @param {Number} offset a number in days
   * @returns {Date}
   */
  offsetFromDay(date, offset) {
    // MAKE SURE TO HANDLE DATES CORRECTLY!!
    // **Be careful when doing custom date manipulation.**

    const dayInMonth = date.getDate();
    const dayWithOffset = dayInMonth + offset;

    // See https://stackoverflow.com/a/315767
    const numDaysInCurrentMonth = Calendar.numDaysInMonth(
      date.getMonth(),
      date.getFullYear(),
    );
    if (dayWithOffset > numDaysInCurrentMonth) {
      // roll over to next month

      // minus one because it goes to the end of the current month, then one
      // more day to roll over to the next month.
      const remainingOffset = dayWithOffset - numDaysInCurrentMonth - 1;

      // handle rolling over years too
      // remember that months are 0-indexed (so 0-11)
      const newYear = date.getFullYear() + (date.getMonth() === 11 ? 1 : 0);
      const newMonth = (date.getMonth() + 1) % 12;
      const newDay = 1;
      const newDate = new Date(newYear, newMonth, newDay);

      // be recursive to handle rolling over multiple months
      return Calendar.offsetFromDay(newDate, remainingOffset);
    } else if (dayWithOffset < 1) {
      // roll over to previous month

      // handle rolling over years too
      // remember that months are 0-indexed (so 0-11)
      const newYear = date.getFullYear() - (date.getMonth() === 0 ? 1 : 0);
      // `%` in js isn't modulo, it's remainder. https://stackoverflow.com/a/4467559
      // This does modulo, so eg -2 -> 10
      const newMonth = (((date.getMonth() - 1) % 12) + 12) % 12;

      const numDaysInPrevMonth = Calendar.numDaysInMonth(newMonth, newYear);

      const newDay = numDaysInPrevMonth;
      /** the end on the month */
      const newDate = new Date(newYear, newMonth, newDay);

      // dayWithOffset is negative or 0
      // this is fine because this is setting the newDate to be the end of the month
      const remainingOffset = dayWithOffset;

      // be recursive to handle rolling over multiple months
      return Calendar.offsetFromDay(newDate, remainingOffset);
    } else {
      // oh my god finally the day is within the current month
      // 1 <= dayWithOffset <= numDaysInCurrentMonth
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = dayWithOffset;

      return new Date(year, month, day);
    }
  },

  /**
   * Get the number of days in a given month.
   * @param {Number} month from 0-11 (Jan-Dec)
   * @param {Number} year defaults to the current year
   * @link https://stackoverflow.com/a/315767
   */
  numDaysInMonth(month, year = new Date().getFullYear()) {
    // setting the day to 0 gets the last day of the previous month
    return new Date(year, month + 1, 0).getDate();
  },

  /**
   * Checks if two dates are on the same day.
   * @param {Date} a
   * @param {Date} b
   */
  datesAreSameDay(a, b) {
    // Erase the time component from both, then compare.
    const aErased = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    const bErased = new Date(b.getFullYear(), b.getMonth(), b.getDate());

    return aErased.getTime() === bErased.getTime();
  },

  /**
   * Convert a time from 12-hour time to 24-hour time.
   * @param {Number} hour The 12-hour hour.
   * @param {"AM"|"PM"} amPm
   * @returns {Number}
   */
  hour12ToHour24(hour, amPm) {
    switch (amPm) {
      case "AM":
        // 12AM, ie midnight, is 00:00
        if (hour === 12) return 0;
        return hour;
      case "PM":
        // 12PM, ie noon, is 12:00
        if (hour === 12) return 12;
        return hour + 12;
    }
  },

  /** @param {Date} date @returns {Date} */
  dateForMondayOfWeek(date) {
    // MAKE SURE TO HANDLE DATES CORRECTLY!!
    // **Be careful when doing custom date manipulation.**

    /** number from 0-6 (sunday-saturday) */
    const dayOfWeek = date.getDay();
    /** how much to add to current date to get the monday in the week */
    const offsetFromMonday = 1 - dayOfWeek;
    return Calendar.offsetFromDay(date, offsetFromMonday);
  },
};

const _assert = (...os) => {
  for (const o of os) {
    if (o.eq != null) {
      const [a, b] = o.eq;
      const res = a === b;
      if (!res) {
        console.error(`Assertion failed! ${a} !== ${b}`);
        return false;
      } else {
        return true;
      }
    }
  }
};
const _calendarUnitTests = [
  function oneDayForwardNoRollover() {
    const day = new Date(2024, 3, 22);
    const nextDay = Calendar.offsetFromDay(day, 1);
    return _assert({ eq: [nextDay.getDate(), 23] });
  },
  function oneDayBackNoRollover() {
    const day = new Date(2024, 3, 22);
    const nextDay = Calendar.offsetFromDay(day, -1);
    return _assert({ eq: [nextDay.getDate(), 21] });
  },

  function manyDayForwardNoRollover() {
    const day = new Date(2024, 3, 22);
    const nextDay = Calendar.offsetFromDay(day, 7);
    return _assert({ eq: [nextDay.getDate(), 29] });
  },
  function manyDayBackNoRollover() {
    const day = new Date(2024, 3, 22);
    const nextDay = Calendar.offsetFromDay(day, -7);
    return _assert({ eq: [nextDay.getDate(), 15] });
  },

  function handlesMonthRolloverForward() {
    const day = new Date(2024, 9, 3);
    const nextDay = Calendar.offsetFromDay(day, 30);
    return _assert(
      { eq: [nextDay.getDate(), 2] },
      { eq: [nextDay.getMonth(), 10] },
    );
  },
  function handlesMonthRolloverBack() {
    const day = new Date(2024, 9, 3);
    const nextDay = Calendar.offsetFromDay(day, -7);
    return _assert(
      { eq: [nextDay.getDate(), 26] },
      { eq: [nextDay.getMonth(), 8] },
    );
  },

  function handlesYearRolloverForward() {
    const day = new Date(2024, 9, 3);
    const nextDay = Calendar.offsetFromDay(day, 91);
    return _assert(
      { eq: [nextDay.getDate(), 2] },
      { eq: [nextDay.getMonth(), 0] },
    );
  },
  function handlesYearRolloverBack() {
    const day = new Date(2024, 1, 18);
    const nextDay = Calendar.offsetFromDay(day, 55);
    return _assert(
      { eq: [nextDay.getDate(), 25] },
      { eq: [nextDay.getMonth(), 11] },
    );
  },

  function handlesLeapYear() {
    const day = new Date(2024, 1, 28);
    const nextDay = Calendar.offsetFromDay(day, 1);
    return _assert({ eq: [nextDay.getDate(), 29] });
  },
  function handlesNoLeapYear() {
    const day = new Date(2023, 1, 28);
    const nextDay = Calendar.offsetFromDay(day, 1);
    return _assert(
      { eq: [nextDay.getDate(), 1] },
      { eq: [nextDay.getMonth(), 2] },
    );
  },
];
function _calendarUnitTestsRunAll() {
  for (const test of _calendarUnitTests) {
    const res = test();
    if (res == false) console.error("Test failed!", test.toString());
  }
  console.info("Unit tests finished.");
}
_calendarUnitTestsRunAll();
