/**
 * @typedef {String} Color Either a CSS color in `rgb(<r>,<g>,<b>)` format, or the empty string `""`.
 * @typedef {String} Link
 * @typedef {"To do"|"In progress"|"Completed"|"Graded"|"Missing"|"Overdue"} Status
 * @typedef {null|"bbDropbox"|"turnitin"|"unknownLti"} SubmissionMethod
 */

/**
 * @typedef {Object} Assignment
 * @property {Number} assignmentIndexId
 * @property {Color} color
 * @property {String} title
 * @property {Link} link
 * @property {String?} description an innerHTML string.
 * @property {Status} status
 * @property {Date} dueDate
 * @property {Date} assignedDate
 * @property {Number?} maxPoints
 * @property {{ name: String, link: Link }?} class
 * @property {String} type
 * @property {boolean} isTask
 * @property {SubmissionMethod?} submissionMethod
 */

const Assignment = {
  /**
   * Sort two assignments by status (ascending) and then by type (descending).
   * @param {Assignment} a
   * @param {Assignment} b
   * @returns {-1|0|1}
   */
  sort(a, b) {
    if (a.status === b.status) return Assignment.sortTypes(a.type, b.type);
    return Assignment.sortStatuses(a.status, b.status);
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
    const aIsMajor = a.indexOf("Major") > -1;
    const bIsMajor = b.indexOf("Major") > -1;

    // Sort in descending order
    // `true` is coerced to `1` and `false` is coerced to `0`
    return bIsMajor - aIsMajor;
  },

  /** @param {Assignment} assignment */
  async getBlackbaudReprFor(assignment) {
    if (assignment.isTask) {
      // TODO: Custom Task support
      console.warn(
        "Tried to get Blackbaud representation for custom task. Custom tasks are not yet supported.",
      );
      return undefined;
    }

    const studentUserId = await getStudentUserId();
    const assignmentIndexId = assignment.assignmentIndexId;
    return fetchAssignment(assignmentIndexId, studentUserId);
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
    };
  },

  /** @param {BlackbaudAssignment} blackbaudRepr @returns {SubmissionMethod} */
  getSubmissionMethod(blackbaudRepr) {
    const ltiProvider = blackbaudRepr.LtiProviderName.toLowerCase();
    if (ltiProvider.includes("turnitin")) return "turnitin";
    else if (ltiProvider === "") {
      if (blackbaudRepr.DropboxInd) return "bbDropbox";
      else return null;
    } else {
      console.warn(`Unknown LTI provider: ${ltiProvider}`);
      return "unknownLti";
    }
  },
};
