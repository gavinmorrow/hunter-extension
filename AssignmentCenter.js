/**
 * @typedef {String} Color Either a CSS color in `rgb(<r>,<g>,<b>)` format, or the empty string `""`.
 * @typedef {String} Link
 * @typedef {"To do"|"In progress"|"Completed"|"Graded"|"Missing"|"Overdue"} Status
 */

/**
 * @typedef {Object} AssignmentDetails
 * @property {Date} dueDate
 * @property {Date} assignedDate
 * @property {Number?} maxPoints
 * @property {{ name: String, link: Link }?} class
 * @property {String} type
 * @property {boolean} isTask
 */

/**
 * @typedef {Object} Assignment
 * @property {Color} color
 * @property {String} title
 * @property {Link} link
 * @property {String?} description an innerHTML string.
 * @property {AssignmentDetails} details
 * @property {Status} status
 */

class AssignmentCenter extends HTMLElement {
  /**
   * The original Blackbaud assignment center. (An `app-student-assignment-center`.)
   * @type {HTMLElement}
   */
  oldElem;

  /** @type {Assignment[]} */
  assignments;

  /** @type {Settings} */
  settings;

  // The `calendar` param is needed bc at the time of calling it, the
  // `#main-calendar` element isn't necessarily created yet.
  /**
   * Show a day of the week in the calendar (ie a column in the grid).
   * @param {HTMLElement} calendar The `#main-calendar` element.
   * @param {0|1|2|3|4|5|6} day The day (of the week, 0-indexed) to show. Only `0` and `6` have any effect, the rest are no-ops.
   */
  #showDay(calendar, day) {
    if (day === 0 || day === 6) {
      const dayName = day === 0 ? "sunday" : "saturday";
      const className = `show-${dayName}`;
      calendar.classList.add(className);
    }
  }

  /**
   * @param {HTMLElement} oldElem The original Blackbaud assignment center. (An `app-student-assignment-center`.)
   * @param {Assignment[]} assignments
   * @param {Settings} settings The extension settings. Passed in here so that it can be non-async.
   */
  constructor(oldElem, assignments, settings) {
    super();
    this.oldElem = oldElem;
    this.assignments = assignments;
    this.settings = settings;
  }

  connectedCallback() {
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
    const dateOfMonday = Calendar.dateForSundayOfWeek(today);
    Array(7 /* days */ * 4 /* weeks */)
      .fill(0)
      .map((_, i) => Calendar.offsetFromDay(dateOfMonday, i))
      .map((date) => {
        const box = document.createElement("div");
        box.classList.add("calendar-box");

        // add class for weekends
        const day = date.getDay();
        if (day === 0) box.classList.add("sunday");
        if (day === 6) box.classList.add("saturday");

        if (date.getTime() < today.getTime()) box.classList.add("disabled");
        if (this.#dateIsSelected(date)) box.classList.add("today");

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
        // get assignments for current day
        const assignments = this.assignments.filter((a) =>
          Calendar.datesAreSameDay(a.details.dueDate, date),
        );

        // show the day in calendar (really applies to just weekends, but is a
        // no-op for weekdays so it's okay)
        if (assignments.length > 0) this.#showDay(grid, day);

        // add assignment elements
        assignments
          .sort((a, b) => {
            if (a.status === b.status) {
              // sort by type
              const aMajor = a.details.type.indexOf("Major") > -1;
              const bMajor = b.details.type.indexOf("Major") > -1;
              if (aMajor && !bMajor) return -1;
              if (aMajor && bMajor) return 0;
              if (!aMajor && bMajor) return 1;
            }
            return AssignmentCenter.#sortStatuses(a.status, b.status);
          })
          .map((a) => new AssignmentBox(a, this.settings))
          .map((e) => {
            const li = document.createElement("li");
            li.appendChild(e);
            return li;
          })
          .forEach((li) => list.appendChild(li));
        box.appendChild(list);

        return box;
      })
      .filter((e) => e != null)
      .forEach((list) => grid.appendChild(list));

    return grid;
  }

  /**
   * @param {Status} a
   * @param {Status} b
   * @returns {-1|0|1}
   */
  static #sortStatuses(a, b) {
    // TODO: treat "To do" and "In progress" as equal?
    const order = [
      "Missing",
      "Overdue",
      "To do",
      "In progress",
      "Completed",
      "Graded",
    ];
    return order.indexOf(a) - order.indexOf(b);
  }

  /** @returns {Promise<Assignment[]>} A promise of an array of Assignments sorted by due date. */
  static async scrapeAssignments() {
    const assignments = await waitForElems(
      "app-student-assignments-repeater sky-repeater-item-content sky-repeater sky-repeater-item-title",
    );
    if (assignments == null) return null;

    return Array.from(assignments)
      .map(AssignmentCenter.#parseAssignmentElem)
      .toSorted(
        /** @param {Assignment} a @param {Assignment} b */ (a, b) =>
          a.details.dueDate - b.details.dueDate,
      );
  }

  /**
   * @param {HTMLElement} elem
   * @returns {Assignment}
   */
  static #parseAssignmentElem(elem) {
    // sky-split-view-workspace-content Whole section
    //   app-student-assignments-repeater Each header(+content)
    //     sky-repeater-item-content content For each header
    //       sky-repeater sky-repeater-item-title Indiv assignment
    //           div.left-block Assignment color (its in the style:background-color)
    //           div.middle-block Assignment data
    //             div:nth(0) Assignment title
    //               app-assignment-title-link a The link itself
    //             div.assignment-details Assignment details
    //               text node The " Due: 9/20/2024 11:59 PM | Assigned: 9/12/2024 12:00 AM " text
    //               span:nth(0) button a The class link "CHEMISTRY - 60"
    //               span:nth(1) The " | Test/Exam (Major) "
    //               span:nth(2) The " | Assignment "
    //           div.right-block app-assignment-status-display Assignment status
    //               sky-icon i::before Status icon
    //               button Status text // FIXME: does this work when you can't click it?

    const color = elem.querySelector("div.left-block").style.backgroundColor;
    const { textContent: title, href: link } = elem.querySelector(
      "div.middle-block app-assignment-title-link a",
    );
    const details = AssignmentCenter.#parseFullDetailsElem(
      elem.querySelector("div.middle-block div.assignment-details"),
    );
    const status = elem
      .querySelector("div.right-block app-assignment-status-display")
      .textContent.trim();

    return {
      color,
      title,
      link,
      details,
      status,
    };
  }

  /**
   * @param {HTMLElement} detailsElem
   * @returns {AssignmentDetails}
   */
  static #parseFullDetailsElem(detailsElem) {
    const details = detailsElem.textContent;
    const parts = details.split("|").map((part) => part.trim());

    // invalid length
    if (parts.length !== 4 && parts.length !== 5 && parts.length !== 6) {
      console.error(`Invalid parts length: ${parts.length}`);
      return null;
    }
    // tasks cannot have points, so this is okay
    const isTask = parts.length === 4;
    const hasPoints = parts.length === 6;

    // first two elements
    const [dueDate, assignedDate] = parts
      .slice(0, 2)
      // The strings start with either "Due: " or "Assigned: ", followed by a
      // date. To parse the date, they need to be removed.
      .map((str) => str.replace("Due: ", "").replace("Assigned: ", ""))
      .map(AssignmentCenter.#parseBlackbaudDate);
    const maxPoints = hasPoints ? parseInt(parts[2]) : null;
    // *maybe* the third element
    const class_ = isTask
      ? null
      : { name: parts[2], link: detailsElem.querySelector("button a").href };
    // the last two elements (type is second-to-last).
    // _assignmentOrTask is the literal string "Assignment" or "My tasks",
    // which isn't very useful for anything, so it is ignored.
    const [_assignmentOrTask, type] = parts.toReversed();

    return {
      dueDate,
      assignedDate,
      maxPoints,
      class: class_,
      type,
      isTask,
    };
  }

  /**
   * Parse a blackbaud date string into a javascript `Date`.
   * @param {String} str A date in the format `mm/dd/yyyy hh:mm AM`.
   * @returns {Date}
   */
  static #parseBlackbaudDate(str) {
    const [date, time, amPm] = str.split(" ");
    const [month, day, year] = date.split("/").map(Number);
    const [hour12, min] = time.split(":").map(Number);
    const hour24 = Calendar.hour12ToHour24(hour12, amPm);

    return new Date(year, month - 1, day, hour24, min);
  }

  /**
   * Check if the date given is the one to be highlighted in the calendar.
   * @param {Date} date
   */
  #dateIsSelected(date) {
    return Calendar.datesAreSameDay(date, this.#findSelectedDate());
  }

  /**
   * Finds the date that should be selected in the calendar.
   * @param {number} start How many days from today to start counting. Defaults to `1`.
   */
  #findSelectedDate(start = 1) {
    const today = new Date();
    for (let offset = start; true; offset += 1) {
      const date = Calendar.offsetFromDay(today, offset);

      // check if assignments exist on date
      const assignmentsExistOnDate =
        this.assignments.filter((a) =>
          Calendar.datesAreSameDay(a.details.dueDate, date),
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

  & .calendar-box.disabled::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background-color: oklch(from var(--color-bg-box) calc(l*75%) c h / 50%);
    backdrop-filter: blur(0.1em);
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
