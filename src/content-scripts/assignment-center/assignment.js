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
 * @property {AssignmentAttachment[]} attachments Both download and link items.
 */

/**
 * @typedef {Object} AssignmentAttachment
 * @property {string} url
 * @property {boolean} expired
 * @property {string} name The name to show to the user. *Not* a filename. Equivalent to `ShortDescription`.
 */

const Assignment = {
  /**
   * Parse an assignment from its BB API representation.
   * @param {BlackbaudAssignmentPreview} blackbaudRepr
   * @returns {Assignment}
   */
  parse(blackbaudRepr) {
    if (blackbaudRepr == null) return null;

    return {
      // I'm not sure when the AssignmentId is used, but I'm also not sure if the AssignmentIndexId always exists.
      id: blackbaudRepr.AssignmentIndexId ?? blackbaudRepr.AssignmentId,
      color: api.getClassColors()[blackbaudRepr.SectionId],
      title: blackbaudRepr.ShortDescription,
      link: blackbaudRepr.AssignmentIndexId != null ? `https://hunterschools.myschoolapp.com/lms-assignment/assignment/assignment-student-view/${blackbaudRepr.AssignmentIndexId}` : ``,
      description: null,
      status: Assignment.getStatusText(blackbaudRepr),
      dueDate: BlackbaudDate.parse(blackbaudRepr.DateDue),
      assignedDate: BlackbaudDate.parse(blackbaudRepr.DateAssigned),
      maxPoints: blackbaudRepr.MaxPoints,
      isExtraCredit: blackbaudRepr.ExtraCredit,
      class: { id: blackbaudRepr.SectionId, name: blackbaudRepr.GroupName },
      type: blackbaudRepr.AssignmentType,
      // tasks are parsed elsewhere
      isTask: false,
      submissionMethod: null,
      attachments: [],
    };
  },

  getStatusText(/** @type {BlackbaudAssignmentPreview} */ blackbaudRepr) {
    switch (blackbaudRepr.AssignmentStatus) {
      case -1: return "To do";
      case 0: return "In progress";
      case 1: return "Completed";
      // FIXME: coule also be missing.
      case 2: return "Overdue";
      default:
        console.error("Unkonwn status", blackbaudRepr.AssignmentStatus);
        return "To do";
    }
  },

  // A seperate function so that `parse` can be non-async.
  async addColor(a) {
    try {
      const colors = await api.getClassColors();
      return { ...a, color: colors.get(Number(a.class.id)) };
    } catch (err) {
      reportError(err);
      return { ...a, color: "#111" };
    }
  },

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
      attachments: Assignment.parseBlackbaudAttachments(blackbaudRepr),
    };
  },

  /**
   * Parse into the `assignment.attachments`.
   * @param {BlackbaudAssignment} blackbaudRepr
   * @returns {AssignmentAttachment[]}
   */
  parseBlackbaudAttachments(blackbaudRepr) {
    if (blackbaudRepr == null) return;

    const downloadItems = blackbaudRepr.DownloadItems.map(
      Assignment.parseBlackbaudDownloadItem,
    );
    const linkItems = blackbaudRepr.LinkItems.map(Assignment.parseBlackbaudLinkItem);
    return downloadItems.concat(linkItems);
  },

  /** @returns {AssignmentAttachment} */
  parseBlackbaudDownloadItem(/** @type {BlackbaudDownloadItem} */ item) {
    return {
      url: item.DownloadUrl,
      expired: item.Expired,
      name: item.ShortDescription,
    };
  },

  /** @returns {AssignmentAttachment} */
  parseBlackbaudLinkItem(/** @type {BlackbaudLinkItem} */ item) {
    return {
      url: item.Url,
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
