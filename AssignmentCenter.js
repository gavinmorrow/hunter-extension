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
}
`;
    shadow.appendChild(style);

    const text = document.createElement("ol");
    text.append(
      ...this.assignments.map((assignment) => {
        const li = document.createElement("li");
        const box = new AssignmentBox(assignment);
        li.appendChild(box);
        return li;
      }),
    );
    shadow.appendChild(text);
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
