console.log("Modifying assignment center...");

/**
 * FIXES: At the top of the calendar, if the month is too long, it wraps onto
 * the next line. However, the containing div doesn't grow to fit.
 */
const fixCalendarHeaderOverflow = async () => {
  const calHeader = await waitForElem("#calendar-date-container");
  if (calHeader) calHeader.style.height = "fit-content";
  else console.error("calendar header not found.");
};

Promise.allSettled([fixCalendarHeaderOverflow()]);
