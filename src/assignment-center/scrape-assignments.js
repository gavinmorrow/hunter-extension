/**
 * Parse a blackbaud date string into a javascript `Date`.
 * @param {String} str A date in the format `mm/dd/yyyy hh:mm AM`.
 * @returns {Date}
 */
const parseBlackbaudDate = (str) => {
  const [date, time, amPm] = str.split(" ");
  const [month, day, year] = date.split("/").map(Number);
  const [hour12, min] = time.split(":").map(Number);
  const hour24 = Calendar.hour12ToHour24(hour12, amPm);

  return new Date(year, month - 1, day, hour24, min);
};

/**
 * @param {HTMLElement} detailsElem
 * @returns {AssignmentDetails}
 */
const parseFullDetailsElem = (detailsElem) => {
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
    .map(parseBlackbaudDate);
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
};

/**
 * @param {HTMLElement} elem
 * @returns {Assignment}
 */
const parseAssignmentElem = (elem) => {
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
  const assignmentIndexId = Number(
    link.match(
      /lms-assignment\/assignment\/assignment-student-view\/(?<id>\d+)/,
    )?.groups.id,
  );
  const details = parseFullDetailsElem(
    elem.querySelector("div.middle-block div.assignment-details"),
  );
  const status = elem
    .querySelector("div.right-block app-assignment-status-display")
    .textContent.trim();

  return {
    assignmentIndexId,
    color,
    title,
    link,
    details,
    status,
  };
};

/**
 * Get the filter element for either "Active assignments" or "Past assignments".
 * @param {"Active"|"Past"} time
 * @returns {Promise<HTMLElement>}
 */
const filterElem = async (time) =>
  await waitFor(() =>
    Array.from(document.querySelectorAll("sky-radio label")).find(
      (elem) => elem.textContent == `${time} assignments`,
    ),
  );

/**
 * Sets the assignment filter to filter by "Active" or "Past".
 * @param {"Active"|"Past"} time
 */
const filterBy = async (time) => filterElem(time).then((e) => e.click());

const withFilter = async (time, fn) => {
  await filterBy(time);
  const res = await fn();
  await filterBy("Active");
  return res;
};

// So there's this *hilarious* bug: if there's an assignment due on Sunday,
// then it will duplicated on Saturday (bc it shows up under both the Due
// Tomorrow and Due Next Week sections in list view). The best part is that it
// also shows up as duplicated in the calendar view??? How??? Anyways, I
// decided that the simplest solution was to just always deduplicate all
// assignments.
/** @param {Assignment[]} assignments @returns {Assignment[]} */
const deduplicateAssignments = (assignments) =>
  Array.from(
    assignments
      // Use a Map, bc it already has deduplicating features in it.
      // I don't use an object bc Map is kind of designed for this.
      .reduce((map, a) => map.set(a.assignmentIndexId, a), new Map())
      .values(),
  );

/**
 * @param {"Active"|"Past"} time
 * @returns {Promise<Assignment[]>} A promise of an array of Assignments sorted by due date.
 */
const scrapeAssignments = (time) =>
  withFilter(time, async () => {
    const assignments = await waitForElems(
      "app-student-assignments-repeater sky-repeater-item-content sky-repeater sky-repeater-item-title",
    );
    if (assignments == null) return null;

    // parse -> deduplicate -> sort
    return deduplicateAssignments(
      Array.from(assignments).map(parseAssignmentElem),
    ).toSorted(
      /** @param {Assignment} a @param {Assignment} b */ (a, b) =>
        a.details.dueDate - b.details.dueDate,
    );
  });
