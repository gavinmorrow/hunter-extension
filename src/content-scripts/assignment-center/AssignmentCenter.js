class AssignmentCenter extends HTMLElement {
  /** @type {Assignment[]} */
  assignments;

  /** @type {Settings} */
  settings;

  /**
   * Show a day of the week in the calendar (ie a column in the grid).
   * @param {HTMLElement} calendar The `#main-calendar` element.
   * @param {0|1|2|3|4|5|6} day The day (of the week, 0-indexed) to show. Only `0` and `6` have any effect, the rest are no-ops.
   */
  #showDay(day) {
    const calendar = this.shadowRoot.getElementById("main-calendar");
    if (day === 0 || day === 6) {
      const dayName = day === 0 ? "sunday" : "saturday";
      const className = `show-${dayName}`;
      calendar.classList.add(className);
    }
  }

  /**
   * @param {Assignment[]} assignments
   * @param {Settings} settings The extension settings. Passed in here so that it can be non-async.
   */
  constructor(assignments, settings) {
    super();
    this.assignments = assignments;
    this.settings = settings;

    this.addAssignments = this.#addAssignments.bind(this);
    this.addTask = this.#addTask.bind(this);

    // create DOM
    // Create a shadow root
    const shadow = this.attachShadow({ mode: "open" });

    // Prevent blackbaud from throwing a fit in the console
    shadow.addEventListener("click", (e) => e.stopPropagation());
    shadow.addEventListener("mousedown", (e) => e.stopPropagation());

    const style = document.createElement("style");
    style.textContent = this.#getStylesheet();
    shadow.appendChild(style);

    const root = document.createElement("main");
    root.appendChild(this.#createCalendarGrid());
    shadow.appendChild(root);
  }

  connectedCallback() {
    this.#hydrateCalendar();
  }

  #createCalendarGrid() {
    const grid = document.createElement("div");
    grid.id = "main-calendar";

    // create top row
    Array(7)
      .fill(0)
      .map((_, i) => {
        switch (i) {
          case 0:
            return "Sunday";
          case 1:
            return "Monday";
          case 2:
            return "Tuesday";
          case 3:
            return "Wednesday";
          case 4:
            return "Thursday";
          case 5:
            return "Friday";
          case 6:
            return "Saturday";
        }
      })
      .map((day) => {
        const box = document.createElement("div");
        box.classList.add("calendar-header-box");
        if (day === "Sunday" || day === "Saturday")
          box.classList.add(day.toLowerCase());
        box.textContent = day;
        return box;
      })
      .forEach((elem) => grid.appendChild(elem));

    // create 4 weeks starting from this week
    // MAKE SURE TO HANDLE DATES CORRECTLY!!
    // **Be careful when doing custom date manipulation.**
    const today = Calendar.resetDate(new Date());
    AssignmentCenter.#allCalendarDates()
      .map((date) => {
        const box = document.createElement("div");
        box.classList.add("calendar-box");

        // add class for weekends
        const day = date.getDay();
        if (day === 0) box.classList.add("sunday");
        if (day === 6) box.classList.add("saturday");

        if (date.getTime() < today.getTime()) box.classList.add("past");

        const dateElem = document.createElement("p");
        dateElem.classList.add("calendar-date");
        if (date.getDate() === 1)
          dateElem.textContent =
            date.toLocaleString("default", {
              month: "short",
            }) + " ";
        dateElem.textContent += date.getDate();
        box.appendChild(dateElem);

        const list = document.createElement("ul");
        list.id = AssignmentCenter.#idForAssignmentList(date);
        box.appendChild(list);

        return box;
      })
      .filter((e) => e != null)
      .forEach((list) => grid.appendChild(list));

    return grid;
  }

  #hydrateCalendar() {
    for (const assignment of this.assignments) {
      const date = Calendar.resetDate(assignment.dueDate);
      const list = this.shadowRoot.getElementById(
        AssignmentCenter.#idForAssignmentList(date),
      );

      // skip if the date isn't being shown in the calendar
      if (list == null) continue;
      // otherwise make sure the date is shown. really applies to just weekends,
      // but is a no-op for weekdays so it's always okay.
      else this.#showDay(date.getDay());

      let box =
        this.#findAssignmentBoxFor(assignment.id) ??
        this.#createAssignmentBox(assignment);
      // TODO: Don't completely rerender everything
      box.updateAssignment(assignment);

      if (!list.contains(box.parentElement)) {
        // Append the containing <li>, not the box itself
        list.appendChild(box.parentElement);
      }

      // Eventually the description will be updated, just not immediately
      // since we can't wait that long.
      // Only do it for assignments bc tasks don't have descriptions.
      if (!assignment.isTask) this.#asyncAddDescriptionToAssignment(assignment);
    }

    this.#updateTodayElem();
  }

  /**
   * Create an <assignment-box> inside of a <li> for the given assignment.
   * @param {Assignment} assignment
   * @returns {AssignmentBox}
   */
  #createAssignmentBox(assignment) {
    const box = new AssignmentBox(
      assignment,
      this.#updateAssignment.bind(this, assignment.id, assignment.isTask),
      this.#addTask.bind(this),
      this.settings,
    );
    document.createElement("li").appendChild(box);
    return box;
  }

  /** @param {assignment} @returns {void} */
  #asyncAddDescriptionToAssignment(assignment) {
    // Intentionally not await-ing the Promise.
    Assignment.getBlackbaudReprFor(assignment)
      .then(Assignment.parseBlackbaudRepr)
      .then(
        this.#updateAssignment.bind(this, assignment.id, assignment.isTask),
      );
  }

  #updateTodayElem() {
    // remove today class from old today
    const today = this.shadowRoot.querySelector(".today");
    today?.classList.remove("today");

    // add today class to new today
    const todayList = this.shadowRoot.getElementById(
      AssignmentCenter.#idForAssignmentList(this.#findSelectedDate()),
    );
    todayList?.parentElement.classList.add("today");
  }

  static #allCalendarDates() {
    const today = Calendar.resetDate(new Date());
    const dateOfSunday = Calendar.dateForSundayOfWeek(today);
    return Array(7 /* days */ * 4 /* weeks */)
      .fill(0)
      .map((_, i) => Calendar.offsetFromDay(dateOfSunday, i));
  }

  static #idForAssignmentList(date) {
    return `assignment-list-${date.getTime()}`;
  }

  /** @param {Assignment[]} newAssignments */
  #addAssignments(newAssignments) {
    this.assignments = this.assignments.concat(newAssignments);
    this.#hydrateCalendar();
  }

  // TODO: refactor
  /** @param {BlackbaudTask} task */
  async #addTask(task) {
    let id = task.UserTaskId;
    if (task.UserTaskId == undefined || task.UserTaskId === "")
      id = (await createTask(task)) ?? id;
    else await updateTask(task);

    if (id == undefined) {
      console.error("Task could not be saved.");
      return;
    }

    console.log(`Task ${id} saved.`);

    this.assignments = await Task.populateAllIn(this.assignments);
    this.#hydrateCalendar();
  }

  /** @param {Number} id @param {boolean} isTask @param {Assignment?} changes */
  #updateAssignment(id, isTask, changes) {
    // update internal object
    const index = this.assignments.findIndex((a) => a.id === id);
    if (index === -1) return;
    this.assignments[index] = { ...this.assignments[index], ...changes };

    // check for if the status in the backend needs to be updated
    if (changes?.status != undefined) {
      // This ignores a promise. It's okay, because we're not depending on the
      // result.
      if (isTask) updateTaskStatus(this.assignments[index]);
      else updateAssignmentStatus(id, changes.status, isTask);
    }

    // check if task needs to be deleted
    if (isTask && changes === null) {
      // This ignores a promise. It's okay, because we're not depending on the
      // result.
      deleteTask(id);

      // remove the entry in this.assignments for it
      this.assignments.splice(index, 1);

      // remove the element corresponding to it
      this.#findAssignmentBoxFor(id).remove();
    } else {
      // otherwise, update the element corresponding to it
      /** @type {AssignmentBox} */
      const assignmentBox = this.#findAssignmentBoxFor(id);
      assignmentBox.updateAssignment(this.assignments[index]);
    }
  }

  /** @param {number} id @returns {AssignmentBox} */
  #findAssignmentBoxFor(id) {
    return Array.from(this.shadowRoot.querySelectorAll("assignment-box")).find(
      (box) => box.assignment.id === id,
    );
  }

  /**
   * Finds the date that should be selected in the calendar.
   * @param {number} start How many days from today to start counting. Defaults to `1`.
   */
  #findSelectedDate(start = 1) {
    const today = new Date();
    if (this.assignments.length === 0) return today;
    for (let offset = start; true; offset += 1) {
      const date = Calendar.offsetFromDay(today, offset);

      // check if assignments exist on date
      const assignmentsExistOnDate =
        this.assignments.filter((a) =>
          Calendar.datesAreSameDay(a.dueDate, date),
        ).length > 0;
      if (assignmentsExistOnDate) return date;
    }
  }

  #getStylesheet() {
    return `\
main {
  --color-text: #eee;
  --color-text-link: #fff;

  --color-border: #333;

  --color-bg-root: #111;
  --color-bg-box: oklch(from var(--color-bg-root) calc(l*120%) c h);

  color: var(--color-text);
  background-color: var(--color-bg-root);

  padding: 1em;
}

#main-calendar {
  --show-sunday: 0;
  --show-saturday: 0;
  &.show-sunday { --show-sunday: 1; }
  &.show-saturday { --show-saturday: 1; }

  --num-grid-columns: calc(5 + var(--show-sunday) + var(--show-saturday));
  display: grid;
  /* The "0" is to prevent column from growing past 1fr.
   * See <https://stackoverflow.com/a/43312314> */
  grid-template-columns: repeat(var(--num-grid-columns), minmax(0, 1fr));
  grid-template-rows: auto;
  grid-auto-rows: minmax(7em, auto);

  margin-bottom: 7em;

  border: 0.5px solid var(--color-border);
  & > * {
    border: 0.5px solid var(--color-border);
  }

  & .calendar-header-box {
    text-align: center;
  }

  & .calendar-box {
    position: relative;
    background-color: var(--color-bg-box);

    & > * {
      margin: 0;
      padding: 0;
    }

    & .calendar-date {
      background-color: oklch(from var(--color-bg-box) calc(l*120%) c h);
      padding: 0 0.25em;
    }

    & ul {
      list-style-type: none;

      & li {
        margin: 0.5em;
      }
    }

    &.today, &.today .calendar-date {
      background-color: black;
    }
  }

  & .calendar-box.past::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background-color: oklch(from var(--color-bg-box) calc(l*75%) c h / 50%);
    /* backdrop-filter: blur(0.1em); */

    pointer-events: none;
    z-index: 1;
  }

  &:not(.show-sunday) .sunday {
    display: none
  }
  &:not(.show-saturday) .saturday {
    display: none
  }
}
`;
  }
}

if (!customElements.get("assignment-center")) {
  customElements.define("assignment-center", AssignmentCenter);
}
