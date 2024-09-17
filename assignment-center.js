console.log("Modifying assignment center...");

const views = {
  calendar: async () => views.getElem("calendar"),
  list: async () => views.getElem("list"),

  /** @param {"list"|"calendar"} view */
  switchTo: async (view) => views.getElem(view).then((btn) => btn.click()),

  /** @param {"list"|"calendar"} view The name of the icon in the input */
  getElem: async (view) =>
    waitForElem(`[aria-label='Assignment center view'] [icon='${view}'] input`),

  currentView: async () => {
    const calendar = await views.getElem("calendar");
    const list = await views.getElem("list");

    if (calendar.value === "1") return "calendar";
    else if (list.value === "1") return "list";
    else throw new Error("Unknown view!"); // unreachable
  },
};

/**
 * FIXES: At the top of the calendar, if the month is too long, it wraps onto
 * the next line. However, the containing div doesn't grow to fit.
 */
const fixCalendarHeaderOverflow = featureFlag(
  (s) => s.assignmentCenter.calendar.fixCalendarHeaderOverflow,
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
  (s) => s.assignmentCenter.list.fullStatusColors,
  async () => {
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

const assignmentCenterBroken = featureFlag(
  (s) => s.assignmentCenter.reloadOnBroken,
  async () => {
    const noActiveAssignments =
      document.body.textContent.indexOf("0 Active assignments") > -1;
    const notLoggedIn = (await waitForElem("#site-logo")) === null;
    if (noActiveAssignments && notLoggedIn) location.reload();
  },
);

const modifyCalendarView = featureFlag(
  (s) => s.assignmentCenter.calendar.enabled,
  async () => {
    await fixCalendarHeaderOverflow();
  },
);

const modifyListView = featureFlag(
  (s) => s.assignmentCenter.list.enabled,
  async () => {
    await colorByStatus();
  },
);

promiseError(async () => {
  // needs to go first, bc everything else will fail if it is broken
  await assignmentCenterBroken();

  await modifyCalendarView();

  // Do this afterwards, because it requires switching to the list view.
  await views.switchTo("list");
  await modifyListView();
})();
