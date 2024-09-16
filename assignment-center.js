console.log("Modifying assignment center...");

// FIXME: doesn't work since the other one switches away from calendar.
/**
 * FIXES: At the top of the calendar, if the month is too long, it wraps onto
 * the next line. However, the containing div doesn't grow to fit.
 */
const fixCalendarHeaderOverflow = featureFlag(
  (s) => s.assignmentCenter.fixCalendarHeaderOverflow,
  async () => {
    const calHeader = await waitForElem("#calendar-date-container");
    if (calHeader) calHeader.style.height = "fit-content";
    else console.error("calendar header not found.");
  },
);

const statusColorFor = async (status) => {
  const {
    assignmentCenter: { statusColors },
  } = await settings();
  switch (status) {
    case "To do":
      return statusColors.todo;
    case "In progress":
      return statusColors.inProgress;
    case "Completed":
      return statusColors.completed;
  }
};

// FIXME: doesn't refresh when html changes
// maybe use observer for that?
const colorByStatus = featureFlag(
  (s) => s.assignmentCenter.fullStatusColors,
  async () => {
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
      elem.style.backgroundColor = await statusColorFor(status);
    }
  },
);

promiseError(async () => {
  await Promise.allSettled([fixCalendarHeaderOverflow(), colorByStatus()]);
})();
