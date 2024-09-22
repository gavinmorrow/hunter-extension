console.info("Modifying assignment center...");

/**
 * @typedef {"list"|"calendar"} View
 */
const views = {
  calendar: async () => views.getElem("calendar"),
  list: async () => views.getElem("list"),

  /** @param {View} view */
  switchTo: async (view) => views.getElem(view).then((btn) => btn.click()),

  /** @param {View} view The name of the icon in the input */
  getElem: async (view) =>
    waitForElem(`[aria-label='Assignment center view'] [icon='${view}'] input`),

  currentView: async () => {
    /** @type {HTMLInputElement} */
    const calendar = await views.getElem("calendar");
    /** @type {HTMLInputElement} */
    const list = await views.getElem("list");

    if (calendar.checked) return "calendar";
    else if (list.checked) return "list";
    else {
      console.error("Unknown view!");
      debugger;
      return null;
    }
  },

  /**
   * Register an event handler to be called on every view change.
   * @param {(newView: View, e: Event) => any} fn
   */
  onChange: async (fn) => {
    const allViews = ["calendar", "list"];
    for (const view of allViews) {
      const elem = await views.getElem(view);
      elem.addEventListener("change", fn.bind(null, view));
    }
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

const filterByNotCompleted = featureFlag(
  (s) => s.assignmentCenter.filter.autoNotCompleted,
  async () => {
    const completedInput = await waitFor(async () =>
      Array.from(
        document.querySelectorAll("label.sky-checkbox-wrapper.sky-switch"),
      )
        .filter((e) => e.textContent === "Completed")[0]
        .querySelector("input"),
    );
    if (completedInput?.checked === true) completedInput.click();
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

const createCustomUi = async () => {
  // switch to list view, so scraping is possible
  views.switchTo("list");

  const oldElem = document.querySelector("app-student-assignment-center");

  // construct our own element
  const assignmentCenter = new AssignmentCenter(
    oldElem,
    await AssignmentCenter.scrapeAssignments(),
  );
  oldElem.parentElement.appendChild(assignmentCenter);

  // hide theirs
  oldElem.hidden = true;
};

const assignmentCenterBroken = featureFlag(
  (s) => s.assignmentCenter.reloadOnBroken,
  async () => {
    const loggedIn = (await waitForElem("#site-logo", 2000)) != null;
    const activeAssignments =
      document.body.textContent.indexOf("0 Active assignments") === -1;
    if (!activeAssignments && !loggedIn) location.reload();

    if ((await views.currentView()) == null) await views.switchTo("calendar");
  },
);

const modifyCalendarView = featureFlag(
  (s) => s.assignmentCenter.calendar.enabled,
  async () => {
    console.info("Modifying calendar view...");
    await fixCalendarHeaderOverflow();
  },
);

const modifyListView = featureFlag(
  (s) => s.assignmentCenter.list.enabled,
  async () => {
    console.info("Modifying list view...");
    console.log(await scrapeAssignments());
  },
);

const modifyFilters = featureFlag(
  (s) => s.assignmentCenter.filter.enabled,
  async () => {
    console.info("Modifying filters...");
    await filterByNotCompleted();
  },
);

const modifyView = async (view) => {
  switch (view) {
    case "calendar":
      await modifyCalendarView();
      break;
    case "list":
      await modifyListView();
      break;
    default:
      throw new Error(`Unknown view: ${view}`);
  }
};

promiseError(async () => {
  // needs to go first, bc everything else will fail if it is broken
  await assignmentCenterBroken();

  if ((await settings()).assignmentCenter.customUi.enabled) {
    await createCustomUi();
  } else {
    // These are seperate bc filters don't get reset on view change
    await modifyFilters();

    views.onChange(modifyView);
    await modifyView(await views.currentView());
  }
})();
