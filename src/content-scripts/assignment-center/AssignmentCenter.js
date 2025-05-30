class AssignmentCenter extends HTMLElement {
  /** @type {Assignment[]} */
  assignments;

  /** @type {Settings} */
  settings;

  /** @type {HTMLElement} */
  #grid;

  /** @type {[Date, Date]} */
  #visibleDateRange;

  /** @type {[number, number, number, number, number, number]} */
  #assignmentsOnDay = [0, 0, 0, 0, 0, 0];

  /**
   * Show a day of the week in the calendar (ie a column in the grid).
   * @param {HTMLElement} calendar The `#main-calendar` element.
   * @param {0|1|2|3|4|5|6} day The day (of the week, 0-indexed) to show. Only `0` and `6` have any effect, the rest are no-ops.
   */
  #showDay(day) {
    this.#assignmentsOnDay[day] += 1;

    if (day === 0 || day === 6) {
      const calendar = this.shadowRoot.getElementById("main-calendar");

      const dayName = day === 0 ? "sunday" : "saturday";
      const className = `show-${dayName}`;

      calendar.classList.add(className);
    }
  }

  #hideDay(day) {
    this.#assignmentsOnDay[day] -= 1;

    if (this.#assignmentsOnDay[day] <= 0 && (day === 0 || day === 6)) {
      const calendar = this.shadowRoot.getElementById("main-calendar");

      const dayName = day === 0 ? "sunday" : "saturday";
      const className = `show-${dayName}`;

      calendar.classList.remove(className);
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
    this.meshAssignmentsArray = this.#meshAssignments.bind(this);
    this.extendCalendarGrid = this.#extendCalendarGrid.bind(this);

    this.addEventListener("change-assignment", (e) => {
      this.#updateAssignment(e.id, e.isTask, e.changes).catch(reportError);
      e.stopPropagation();
    });
    this.addEventListener("create-task", (e) => {
      this.#addTask(e.task).catch(reportError);
      e.stopPropagation();
    });

    // create DOM
    // Create a shadow root
    const shadow = this.attachShadow({ mode: "open" });

    // Prevent blackbaud from throwing a fit in the console
    shadow.addEventListener("click", (e) => e.stopPropagation());
    shadow.addEventListener("mousedown", (e) => e.stopPropagation());

    const style = document.createElement("style");
    style.textContent = AssignmentCenter.#stylesheet;
    shadow.appendChild(style);

    const root = document.createElement("main");
    root.appendChild(this.#createCalendarGrid());

    const extendBtn = document.createElement("button");
    extendBtn.textContent = "Extend by 1 week";
    extendBtn.addEventListener("click", () => {
      this.#extendCalendarGrid(1);
    });
    root.appendChild(extendBtn);

    shadow.appendChild(root);
  }

  connectedCallback() {
    this.#hydrateCalendar();
  }

  #createCalendarGrid() {
    this.#grid = document.createElement("div");
    this.#grid.id = "main-calendar";

    // create top row
    [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ]
      .map(this.#createCalendarHeader)
      .forEach((elem) => this.#grid.appendChild(elem));

    // create 4 weeks starting from this week
    // MAKE SURE TO HANDLE DATES CORRECTLY!!
    // **Be careful when doing custom date manipulation.**
    const dates = AssignmentCenter.#allCalendarDates();
    this.#visibleDateRange = [dates[0], dates[dates.length - 1]];
    dates
      .map(this.#createCalendarBox.bind(this))
      .forEach((list) => this.#grid.appendChild(list));

    return this.#grid;
  }

  /** @param {number} weeks If positive, weeks will be appended. If negative, prepended. */
  #extendCalendarGrid(weeks) {
    // FIXME: reduce duplication
    if (weeks == 0) return;

    const boxes = [];
    if (weeks < 0) {
      const originalFirstDay = this.#visibleDateRange[0];
      for (let offset = -1; offset >= weeks * 7; offset--) {
        // TODO: does this always work? not using getSundayOfWeek
        const date = Calendar.offsetFromDay(originalFirstDay, offset);
        const list = this.#createCalendarBox(date);
        boxes.unshift(list);
        this.#visibleDateRange[0] = date;
      }

      const firstBox = this.#grid.querySelector(".calendar-box");
      firstBox.before(...boxes);
    } else if (weeks > 0) {
      const originalLastDay = this.#visibleDateRange[1];
      for (let offset = 1; offset <= weeks * 7; offset++) {
        // TODO: does this always work? not using getSundayOfWeek
        const date = Calendar.offsetFromDay(originalLastDay, offset);
        const list = this.#createCalendarBox(date);
        boxes.push(list);
        this.#visibleDateRange[1] = date;
      }

      this.#grid.append(...boxes);
    }

    // TODO: only rehydrate by date
    this.#hydrateCalendar();
  }

  #createCalendarHeader(
    /** @type {"Sunday"|"Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday"|"Saturday"} */ day,
  ) {
    const box = document.createElement("div");
    box.classList.add("calendar-header-box");
    box.textContent = day;

    if (day === "Sunday" || day === "Saturday") {
      box.classList.add(day.toLowerCase());
    }

    return box;
  }

  #createCalendarBox(/** @type {Date} */ date) {
    const box = document.createElement("div");
    box.classList.add("calendar-box");

    // add class for weekends
    const day = date.getDay();
    if (day === 0) box.classList.add("sunday");
    if (day === 6) box.classList.add("saturday");

    const today = Calendar.resetDate(new Date());
    if (date.getTime() < today.getTime()) box.classList.add("past");

    const dateElem = this.#createCalendarBoxDate(date);
    box.appendChild(dateElem);

    const list = document.createElement("ul");
    list.id = AssignmentCenter.#idForAssignmentList(date);
    box.appendChild(list);

    return box;
  }

  #createCalendarBoxDate(/** @type {Date} */ date) {
    const dateElem = document.createElement("p");
    dateElem.classList.add("calendar-date");
    if (date.getDate() === 1) {
      dateElem.textContent =
        date.toLocaleString("default", {
          month: "short",
        }) + " ";
    }
    dateElem.textContent += date.getDate();
    return dateElem;
  }

  #hydrateCalendar() {
    for (const assignment of this.assignments) {
      const date = Calendar.resetDate(assignment.dueDate);
      const list = this.shadowRoot.getElementById(
        AssignmentCenter.#idForAssignmentList(date),
      );

      // skip if the date isn't being shown in the calendar
      if (list == null) continue;

      let box = this.#findAssignmentBoxFor(assignment.id);
      if (box != null) {
        // TODO: Don't completely rerender everything
        box.updateAssignment(assignment);
      } else {
        this.#insertAssignmentBox(list, assignment);

        // Eventually the description will be updated, just not immediately
        // since we can't wait that long.
        // Only do it for assignments bc tasks don't have descriptions.
        if (!assignment.isTask)
          this.#asyncAddDescriptionToAssignment(assignment);
      }
    }

    this.#updateTodayElem();
  }

  /**
   * Insert an assignment into a list of assignments,
   * in the correct place for the list to remain properly sorted.
   * @param {HTMLUListElement} list
   * @param {Assignment} assignment
   */
  #insertAssignmentBox(list, assignment) {
    const newBox = this.#createAssignmentBox(assignment);

    /**
     * The final, sorted order of assignment boxes in the list.
     * (*After* the new box is inserted.)
     * @type {AssignmentBox[]}
     */
    const idealBoxes = Array.from(list.querySelectorAll("li assignment-box"))
      .concat(newBox)
      .toSorted((a, b) => Assignment.sort(a.assignment, b.assignment));

    // find index to insert
    const index = idealBoxes.findIndex(
      (box) => box.assignment.id === assignment.id,
    );

    /** @type {AssignmentBox?} */
    const nextBox = idealBoxes[index + 1];
    // this works bc when `nextBox` is null it's the same as `list.append`.
    list.insertBefore(newBox.parentElement, nextBox?.parentElement);
    this.#showDay(assignment.dueDate.getDay());
  }

  /**
   * Create an <assignment-box> inside of a <li> for the given assignment.
   * @param {Assignment} assignment
   * @returns {AssignmentBox}
   */
  #createAssignmentBox(assignment) {
    const box = new AssignmentBox(assignment, this.settings);
    document.createElement("li").appendChild(box);
    return box;
  }

  /** @param {assignment} @returns {void} */
  #asyncAddDescriptionToAssignment(assignment) {
    // Intentionally not await-ing the Promise.
    Assignment.getBlackbaudReprFor(assignment)
      .then(Assignment.parseBlackbaudRepr)
      .then(this.#updateAssignment.bind(this, assignment.id, assignment.isTask))
      .catch(reportError);
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

  /** @type {Date[]} */
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

  /** @param {Assignment[]} assignments */
  #meshAssignments(assignments) {
    this.assignments = meshAssignmentsArray(this.assignments, assignments);
    this.#hydrateCalendar();
  }

  // TODO: refactor
  /** @param {BlackbaudTask} task */
  async #addTask(task) {
    const taskExists = task.UserTaskId != undefined && task.UserTaskId != "";
    if (taskExists) {
      await api.updateTask(task);

      // find diff in stored task and task
      const storedTask = this.assignments.find((a) => a.id == task.UserTaskId);
      const parsedTask = await Task.addColor(Task.parse(task));
      const diff = findDiff(storedTask, parsedTask);

      // update stored task
      console.log(`Updating UI for task ${parsedTask.id}`);
      await this.#updateAssignment(parsedTask.id, true, diff);
    } else {
      const id = await api.createTask(task);
      console.log(`Task ${id} saved.`);

      this.assignments = await Task.populateAllIn(this.assignments);
      this.#hydrateCalendar();
      return id;
    }
  }

  /** @param {Number} id @param {boolean} isTask @param {Assignment?} changes */
  async #updateAssignment(id, isTask, changes) {
    try {
      // update internal object
      const index = this.assignments.findIndex((a) => a.id === id);
      if (index === -1) return;
      this.assignments[index] = applyDiff(this.assignments[index], changes);

      // check for if the status in the backend needs to be updated
      if (changes?.status != undefined) {
        if (isTask) await api.updateTaskStatus(this.assignments[index]);
        else await api.updateAssignmentStatus(id, changes.status, isTask);
      }

      // check if task needs to be deleted
      if (isTask && changes === null) {
        await api.deleteTask(id);

        // remove the element corresponding to it
        this.#findAssignmentBoxFor(id).remove();

        const removed = this.assignments.splice(index, 1)[0];
        this.#hideDay(removed.dueDate.getDay());
      } else {
        // otherwise, update the element corresponding to it

        // handle the due date changing (ie w/ tasks)
        if (Object.hasOwn(changes, "dueDate")) {
          const list = this.shadowRoot.getElementById(
            AssignmentCenter.#idForAssignmentList(
              Calendar.resetDate(changes.dueDate),
            ),
          );

          // just remove the old element
          this.#findAssignmentBoxFor(id).remove();
          // reparent, if the day is being shown
          if (list != null) {
            this.#insertAssignmentBox(list, this.assignments[index]);
          }
        }

        // update the element
        /** @type {AssignmentBox} */
        const assignmentBox = this.#findAssignmentBoxFor(id);
        assignmentBox.updateAssignment(this.assignments[index]);
      }
    } catch (err) {
      reportError(err);
    }
  }

  /** @param {number} id @returns {AssignmentBox?} */
  #findAssignmentBoxFor(id) {
    return Array.from(this.shadowRoot.querySelectorAll("assignment-box")).find(
      (/** @type {AssignmentBox} */ box) => box.assignment.id === id,
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

  static #stylesheet = `\
main {
  --color-text: #eee;
  --color-text-link: #fff;

  --color-border: #333;

  --color-bg-root: #111;
  --color-bg-box: oklch(from var(--color-bg-root) calc(l*120%) c h);

  color: var(--color-text);
  background-color: var(--color-bg-root);

  padding: 1em;

  /* Prevent light-colored background from appearing underneath the calendar */
  min-height: 100vh;
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

button {
  ${buttonStylesInner};

  margin-top: 1em;
}
`;
}

if (!customElements.get("assignment-center")) {
  customElements.define("assignment-center", AssignmentCenter);
}
