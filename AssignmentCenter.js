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
main {
  --color-text: #eee;
  --color-text-link: #bbf;

  --color-border: #406;

  --color-bg-root: #203;
  --color-bg-box: oklch(from var(--color-bg-root) calc(l*120%) c h);

  color: var(--color-text);
  background-color: var(--color-bg-root);

  padding: 1em;
}

#main-calendar {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: auto repeat(4, minmax(7em, auto));

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
      padding: 0.5em;
    }

    & .calendar-date {
      background-color: oklch(from var(--color-bg-box) calc(l*120%) c h);
    }

    & ul {
      list-style-type: none;
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
}
`;
    shadow.appendChild(style);

    const root = document.createElement("main");
    root.appendChild(this.#createCalendarGrid());
    shadow.appendChild(root);
  }

  #createCalendarGrid() {
    const grid = document.createElement("div");
    grid.id = "main-calendar";

    // create top row
    Array(5)
      .fill(0)
      .map((_, i) => {
        switch (i) {
          case 0:
            return "Monday";
          case 1:
            return "Tuesday";
          case 2:
            return "Wednesday";
          case 3:
            return "Thursday";
          case 4:
            return "Friday";
        }
      })
      .map((day) => {
        const box = document.createElement("div");
        box.classList.add("calendar-header-box");
        box.textContent = day;
        return box;
      })
      .forEach((elem) => grid.appendChild(elem));

    // create 4 weeks starting from this week
    // MAKE SURE TO HANDLE DATES CORRECTLY!!
    // **Be careful when doing custom date manipulation.**
    const today = new Date();
    const dateOfMonday = Calendar.dateForMondayOfWeek(today);
    Array(7 /* days */ * 4 /* weeks */)
      .fill(0)
      .map((_, i) => Calendar.offsetFromDay(dateOfMonday, i))
      .map((date) => {
        // filter out weekends
        if (date.getDay() == 0 || date.getDay() == 6) return null;

        const box = document.createElement("div");
        box.classList.add("calendar-box");

        if (date.getTime() < today.getTime()) box.classList.add("disabled");

        const dateElem = document.createElement("p");
        dateElem.classList.add("calendar-date");
        dateElem.textContent = date.getDate();
        box.appendChild(dateElem);

        const list = document.createElement("ul");
        this.assignments
          .filter((a) => Calendar.datesAreSameDay(a.details.dueDate, date))
          .map((a) => new AssignmentBox(a))
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

    const style = document.createElement("style");
    style.textContent = `\
article {
  position: relative;
  background-color: oklch(from ${this.#assignmentStatusColor()} 42% 0.07 h);

  padding: 0.25em;
  border-radius: 0.25em;

  /* Thanks to <https://css-tricks.com/restricting-a-pseudo-element-to-its-parents-border-box/> */
  clip-path: inset(0 round 0.25em);
}

article::before {
  content: "";
  background-color: ${this.#assignmentClassColor()};
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 0.25em;
}

p {
  margin: 0;
}

a {
  color: var(--color-text-link);
}
`;
    shadow.appendChild(style);

    const root = document.createElement("article");
    root.appendChild(this.#makeTitleElem());
    shadow.appendChild(root);
  }

  #makeTitleElem() {
    const e = document.createElement("p");
    const a = document.createElement("a");
    a.textContent = this.assignment.title;
    a.href = this.assignment.link;
    e.appendChild(a);
    return e;
  }

  #assignmentClassColor() {
    if (this.assignment.color === "") {
      return "oklch(from var(--color-bg-box) calc(l*200%) c h)";
    } else {
      return this.assignment.color;
    }
  }

  #assignmentStatusColor() {
    console.log({ status: this.assignment.status });
    switch (this.assignment.status) {
      case "To do":
        return "blue";
      case "In progress":
        return "purple";
      case "Completed":
        return "forestgreen";
      case "Graded":
        return "green";
      case "Missing":
      case "Overdue":
        return "red";
      default:
        console.error(`Unknown status "${this.assignment.status}!"`);
        return "oklch(from var(--color-bg-box) calc(l*150%) c h)";
    }
  }
}

if (!customElements.get("assignment-box")) {
  customElements.define("assignment-box", AssignmentBox);
}
