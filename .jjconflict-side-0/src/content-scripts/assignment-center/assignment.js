/**
 * @typedef {String} Color Either a CSS color in `rgb(<r>,<g>,<b>)` format, or the empty string `""`.
 * @typedef {String} Link
 * @typedef {"To do"|"In progress"|"Completed"|"Graded"|"Missing"|"Overdue"} Status
 * @typedef {null|"bbDropbox"|"turnitin"|"googleAssignments"|"unknownLti"} SubmissionMethod
 */

/**
 * @typedef {Object} Assignment
 * @property {Number} id
 * @property {Color} color
 * @property {String} title
 * @property {Link} link
 * @property {String?} description an innerHTML string.
 * @property {Status} status
 * @property {Date} dueDate
 * @property {Date} assignedDate
 * @property {Number?} maxPoints
 * @property {boolean} isExtraCredit
 * @property {{ name: String, link: Link }?} class
 * @property {String} type
 * @property {boolean} isTask
 * @property {SubmissionMethod?} submissionMethod
 * @property {AssignmentAttachment[]} attachments
 */

/**
 * @typedef {Object} AssignmentAttachment
 * @property {string} url
 * @property {boolean} expired
 * @property {string} name The name to show to the user. *Not* a filename. Equivalent to `ShortDescription`.
 */

const Assignment = {
  /**
   * Sort two assignments by status (ascending) and then by type (descending).
   * @param {Assignment} a
   * @param {Assignment} b
   * @returns {-1|0|1}
   */
  sort(a, b) {
    // If statuses are equal, it will be 0 and || will select the other branch
    const res =
      Assignment.sortStatuses(a.status, b.status) ||
      Assignment.sortTypes(a.type, b.type) ||
      sortForArray(a.class.name, b.class.name) ||
      sortForArray(a.title, b.title) ||
      // fallback to sorting by link, so that there is a total sort order
      sortForArray(a.link, b.link);
    if (res === 0) console.error("Two assignments compared as equal!", a, b);
    return res;
  },

  /**
   * Sort statuses in ascending order.
   * Missing < Overdue < To do < In progress < Completed < Graded
   * @param {Status} a
   * @param {Status} b
   * @returns {-1|0|1}
   */
  sortStatuses(a, b) {
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
  },

  /**
   * Sort assignment types in descending order. Majors are the greatest, and
   * everything else is equal.
   * @param {String} a
   * @param {String} b
   * @returns {-1|0|1}
   */
  sortTypes(a, b) {
    // Sort in descending order
    // `true` is coerced to `1` and `false` is coerced to `0`
    return Assignment.typeIsMajor(b) - Assignment.typeIsMajor(a);
  },

  /** @param {Assignment} assignment */
  async getBlackbaudReprFor(assignment) {
    if (assignment.isTask) {
      console.warn(
        "Tried to get Blackbaud representation for custom task. Custom tasks do not have a Blackbaud representation.",
      );
      return undefined;
    }

    const studentUserId = await getStudentUserId();
    return api.fetchAssignment(assignment.id, studentUserId);
  },

  /**
   * @param {BlackbaudAssignment} blackbaudRepr
   * @returns A list of properties to add to the assignment.
   */
  async parseBlackbaudRepr(blackbaudRepr) {
    return {
      description: blackbaudRepr?.LongDescription,
      submissionMethod:
        blackbaudRepr && Assignment.getSubmissionMethod(blackbaudRepr),
      attachments: blackbaudRepr?.DownloadItems.map(
        Assignment.parseBlackbaudDownloadItem,
      ),
    };
  },

  /** @returns {AssignmentAttachment} */
  parseBlackbaudDownloadItem(/** @type {BlackbaudDownloadItem} */ item) {
    return {
      url: item.DownloadUrl,
      expired: item.Expired,
      name: item.ShortDescription,
    };
  },

  /** @param {BlackbaudAssignment} blackbaudRepr @returns {SubmissionMethod} */
  getSubmissionMethod(blackbaudRepr) {
    const ltiProvider = blackbaudRepr.LtiProviderName.toLowerCase();
    if (ltiProvider.includes("turnitin")) return "turnitin";
    else if (ltiProvider.includes("google assignments"))
      return "googleAssignments";
    else if (ltiProvider === "") {
      if (blackbaudRepr.DropboxInd) return "bbDropbox";
      else return null;
    } else {
      console.warn(`Unknown LTI provider: ${ltiProvider}`);
      return "unknownLti";
    }
  },

  /** @param {Assignment} a */
  isCompleted(a) {
    return a.status === "Completed" || a.status === "Graded";
  },

  /** @param {String} type */
  typeIsMajor(type) {
    return type.indexOf("Major") > -1;
  },

  /** @param {Assignment} a */
  isMajor(a) {
    return Assignment.typeIsMajor(a.type);
  },

  /** @param {Assignment} a */
  requiresSubmission(a) {
    return a.submissionMethod != null;
  },
};
