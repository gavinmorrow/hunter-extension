/**
 * @typedef {String} Color Either a CSS color in `rgb(<r>,<g>,<b>)` format, or the empty string `""`.
 * @typedef {String} Link
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
 * @property {AssignmentDetails} details
 */

class AssignmentCenter extends HTMLElement {
  /**
   * The original Blackbaud assignment center. (An `app-student-assignment-center`.)
   * @type {HTMLElement}
   */
  oldElem;

  /** @type {Assignment[]} */
  assignments;

  /**
   * @param {HTMLElement} oldElem The original Blackbaud assignment center. (An `app-student-assignment-center`.)
   * @param {Assignment[]} assignments
   */
  constructor(oldElem, assignments) {
    super();
    this.oldElem = oldElem;
    this.assignments = assignments;
  }

  connectedCallback() {
    // Create a shadow root
    const shadow = this.attachShadow({ mode: "open" });

    // Prevent blackbaud from throwing a fit in the console
    shadow.addEventListener("click", (e) => e.stopPropagation());
    shadow.addEventListener("mousedown", (e) => e.stopPropagation());

    const style = document.createElement("style");
    style.textContent = `\
ol {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(4, 1fr);
}
ol > li {
  background-color: lightgreen;
  border: 2px solid red;
}
`;
    shadow.appendChild(style);

    shadow.appendChild(this.#createCalendarGrid());
  }

  #createCalendarGrid() {
    const grid = document.createElement("ol");

    // create 4 weeks starting from this week
    // MAKE SURE TO HANDLE DATES CORRECTLY!!
    // **Be careful when doing custom date manipulation.**
    const today = new Date();
    const dateOfMonday = AssignmentCenter.#dateForMondayOfWeek(today);
    Array(5 /* days */ * 4 /* weeks */)
      .fill(0)
      .map((_, i) => AssignmentCenter.#offsetFromDay(dateOfMonday, i))
      .map((date) => {
        const li = document.createElement("li");
        li.value = date.getDate();
        const list = document.createElement("ul");
        this.assignments
          .filter((a) =>
            AssignmentCenter.#datesAreSameDay(a.details.dueDate, date),
          )
          .map((a) => new AssignmentBox(a))
          .map((e) => {
            const li = document.createElement("li");
            li.appendChild(e);
            return li;
          })
          .forEach((li) => list.appendChild(li));
        li.appendChild(list);
        return li;
      })
      .forEach((list) => grid.appendChild(list));

    return grid;
  }

  /** @returns {Promise<Assignment[]>} A promise of an array of Assignments sorted by due date. */
  static async scrapeAssignments() {
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

    // const SECTION_NAMES = [
    //   "Missing or overdue",
    //   "Due today",
    //   "Due tomorrow",
    //   "Due this week",
    //   "Due next week",
    //   "Due after next week",
    // ];

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
    const color = elem.querySelector("div.left-block").style.backgroundColor;
    const { textContent: title, href: link } = elem.querySelector(
      "div.middle-block app-assignment-title-link a",
    );
    const details = AssignmentCenter.#parseFullDetailsElem(
      elem.querySelector("div.middle-block div.assignment-details"),
    );

    return {
      color,
      title,
      link,
      details,
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
    const hour24 = AssignmentCenter.#hour12ToHour24(hour12, amPm);

    return new Date(year, month - 1, day, hour24, min);
  }

  /**
   * Convert a time from 12-hour time to 24-hour time.
   * @param {Number} hour The 12-hour hour.
   * @param {"AM"|"PM"} amPm
   * @returns {Number}
   */
  static #hour12ToHour24(hour, amPm) {
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
  }

  /** @param {Date} date @returns {Date} */
  static #dateForMondayOfWeek(date) {
    // MAKE SURE TO HANDLE DATES CORRECTLY!!
    // **Be careful when doing custom date manipulation.**

    /** number from 0-6 (sunday-saturday) */
    const dayOfWeek = date.getDay();
    /** how much to add to current date to get the monday in the week */
    const offsetFromMonday = 1 - dayOfWeek;
    return AssignmentCenter.#offsetFromDay(date, offsetFromMonday);
  }

  /**
   * @param {Date} date
   * @param {Number} offset a number in days
   * @returns {Date}
   */
  static #offsetFromDay(date, offset) {
    // MAKE SURE TO HANDLE DATES CORRECTLY!!
    // **Be careful when doing custom date manipulation.**

    const dayInMonth = date.getDate();
    const dayWithOffset = dayInMonth + offset;

    // See https://stackoverflow.com/a/315767
    const numDaysInCurrentMonth = AssignmentCenter.#numDaysInMonth(
      date.getMonth(),
      date.getFullYear(),
    );
    if (dayWithOffset > numDaysInCurrentMonth) {
      // roll over to next month

      const remainingOffset = dayWithOffset - numDaysInCurrentMonth;

      // handle rolling over years too
      // remember that months are 0-indexed (so 0-11)
      const newYear = date.getFullYear() + (date.getMonth() === 11 ? 1 : 0);
      const newMonth = (date.getMonth() + 1) % 12;
      const newDay = 1;
      const newDate = new Date(newYear, newMonth, newDay);

      // be recursive to handle rolling over multiple months
      return AssignmentCenter.#offsetFromDay(newDate, remainingOffset);
    } else if (dayWithOffset < 1) {
      // roll over to previous month

      // handle rolling over years too
      // remember that months are 0-indexed (so 0-11)
      const newYear = date.getFullYear() - (date.getMonth() === 0 ? 1 : 0);
      // `%` in js isn't modulo, it's remainder. https://stackoverflow.com/a/4467559
      // This does modulo, so eg -2 -> 10
      const newMonth = (((date.getMonth() - 1) % 12) + 12) % 12;

      const numDaysInPrevMonth = AssignmentCenter.#numDaysInMonth(
        newMonth,
        newYear,
      );

      const newDay = numDaysInPrevMonth;
      /** the end on the month */
      const newDate = new Date(newYear, newMonth, newDay);

      // dayWithOffset is negative or 0
      // this is fine because this is setting the newDate to be the end of the month
      const remainingOffset = dayWithOffset;

      // be recursive to handle rolling over multiple months
      return AssignmentCenter.#offsetFromDay(newDate, remainingOffset);
    } else {
      // oh my god finally the day is within the current month
      // 1 <= dayWithOffset <= numDaysInCurrentMonth
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = dayWithOffset;

      return new Date(year, month, day);
    }
  }

  /**
   * Get the number of days in a given month.
   * @param {Number} month from 0-11 (Jan-Dec)
   * @param {Number} year defaults to the current year
   * @link https://stackoverflow.com/a/315767
   */
  static #numDaysInMonth(month, year = new Date().getFullYear()) {
    // setting the day to 0 gets the last day of the previous month
    return new Date(year, month + 1, 0).getDate();
  }

  /**
   * Checks if two dates are on the same day.
   * @param {Date} a
   * @param {Date} b
   */
  static #datesAreSameDay(a, b) {
    // Erase the time component from both, then compare.
    const aErased = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    const bErased = new Date(b.getFullYear(), b.getMonth(), b.getDate());

    return aErased.getTime() === bErased.getTime();
  }
}

if (!customElements.get("assignment-center")) {
  customElements.define("assignment-center", AssignmentCenter);
}

class AssignmentBox extends HTMLElement {
  /** @type {Assignment} */
  assignment;

  /**
   * @param {Assignment} assignment
   */
  constructor(assignment) {
    super();
    this.assignment = assignment;
  }

  connectedCallback() {
    // Create a shadow root
    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(this.#makeTitleElem());
  }

  #makeTitleElem() {
    const e = document.createElement("p");
    const a = document.createElement("a");
    a.textContent = this.assignment.title;
    a.href = this.assignment.link;
    e.appendChild(a);
    return e;
  }
}

if (!customElements.get("assignment-box")) {
  customElements.define("assignment-box", AssignmentBox);
}
