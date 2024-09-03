/// FIXES: At the top of the calendar, if the month is too long, it wraps onto
/// the next line. However, the containing div doesn't grow to fit.
waitForElem("#calendar-date-container").then(
  /** @param {HTMLDivElement} elem */
  (elem) => (elem.style.height = "fit-content"),
);
