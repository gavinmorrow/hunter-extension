console.log("Modifying assignment center...");

// TODO: choose better colors, bc ew
// TODO: make configurable
const STATUS_COLORS = {
  "To do": "blue",
  "In progress": "yellow",
  Completed: "green",
};

/**
 * FIXES: At the top of the calendar, if the month is too long, it wraps onto
 * the next line. However, the containing div doesn't grow to fit.
 */
const fixCalendarHeaderOverflow = async () => {
  const calHeader = await waitForElem("#calendar-date-container");
  if (calHeader) calHeader.style.height = "fit-content";
  else console.error("calendar header not found.");
};

// FIXME: doesn't refresh when html changes
// maybe use observer for that?
const colorByStatus = async () => {
  const listViewBtn = await waitForElem(
    "[aria-label='Assignment center view'] [icon='list'] input",
  );
  listViewBtn.click();

  const getStatusElem = (elem) =>
    elem.querySelector("app-assignment-status-display span");

  const assignments = Array.from(
    await waitForElems(
      "app-student-assignments-repeater .sky-repeater-item-content",
      100,
    ),
  )
    // for some reason, there are some empty rows
    .filter((e) => getStatusElem(e) != null)
    .map((assignmentElem) => ({
      elem: assignmentElem,
      status: getStatusElem(assignmentElem).textContent,
    }));
  console.log(assignments.map((e) => e.status));

  for (const { elem, status } of assignments) {
    elem.style.backgroundColor = STATUS_COLORS[status];
  }
};

Promise.allSettled(
  [fixCalendarHeaderOverflow, colorByStatus].map((fn) => promiseError(fn)()),
);
