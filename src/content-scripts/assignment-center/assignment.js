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
