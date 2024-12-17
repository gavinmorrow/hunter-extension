/**
 * @typedef {Object} BlackbaudAssignment
 * @property {String} LongDescription
 *
 * @property {1} LtiProviderId Seemingly the id of an external assignment submission(?) service. Unclear why it is always 1.
 * @property {""|"Turnitin (HS Only)"} LtiProviderName The name for an external assignment submission(?) service.
 * @property {boolean} DropboxInd Whether or not the Blackbaud file submission is used.
 * @property {number} DropboxNumFiles The maximum number of files that can be submitted through Blackbaud Dropbox.
 * @property {BlackbaudSubmissionResult[]} SubmissionResults The files that the user has submitted through Blackbaud Dropbox.
 *
 * @property {BlackbaudDownloadItem[]} DownloadItems
 */ // lots of other things too but i'm too lazy to list them, add more as needed
/**
 * @typedef {Object} BlackbaudDownloadItem
 * @property {String} DownloadUrl The URL of the file. An absolute link for `https://hunterschools.myschoolapp.com/`.
 * @property {boolean} Expired (Maybe) Whether or not the file is still availble for download??
 * @property {String} FileName The raw file name as stored on the server.
 * @property {String} FriendlyFileName A file name intended for viewing by a user. Unclear why both it and `ShortDescription` exist. Prefer `ShortDescription` in most cases.
 * @property {String} ShortDescription The title of the file to display to the user.
 */ // lots of other things too but i'm too lazy to list them, add more as needed
/**
 * @typedef {Object} BlackbaudSubmissionResult
 * @property {String} DownloadUrl The URL of the file. An absolute link for `https://hunterschools.myschoolapp.com/`.
 * @property {String} FileName The file name as submitted by the user.
 */ // lots of other things too but i'm too lazy to list them, add more as needed

/** Everything involving the Blackbaud API. */
const api = {
  /**
   * Fetch an assignment from the Blackbaud API.
   * @param {string} assignmentIndexId Can be found in the link of an assignment.
   * @param {string} studentUserId Can be found in the user's "Profile" link.
   * @returns {Promise<BlackbaudAssignment>} Direct response from a Blackbaud API.
   */
  async fetchAssignment(assignmentIndexId, studentUserId) {
    return fetch(
      `https://hunterschools.myschoolapp.com/api/assignment2/UserAssignmentDetailsGetAllStudentData?assignmentIndexId=${assignmentIndexId}&studentUserId=${studentUserId}&personaId=2`,
    ).then((r) => r.json());
  },

  statusNumMap: {
    Missing: 2,
    Overdue: 2,
    "To do": -1,
    "In progress": 0, // just mark it same as todo
    Completed: 1,
    Graded: 1,
  },
  async updateAssignmentStatus(assignmentIndexId, status) {
    const assignmentStatus = api.statusNumMap[status];
    console.log(
      `Setting status to ${assignmentStatus} for assignment ${assignmentIndexId}`,
    );

    return fetch(
      `https://hunterschools.myschoolapp.com/api/assignment2/assignmentstatusupdate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignmentIndexId,
          assignmentStatus,
        }),
      },
    );
  },

  nullifyIfZeroTaskSectionId(task) {
    return {
      ...task,
      SectionId:
        Number(task.SectionId ?? 0) === 0 ? null : String(task.SectionId),
    };
  },
  async updateTaskStatus(task) {
    const statusNum = api.statusNumMap[task.status];
    console.log(`Setting status to ${statusNum} for task ${task.id}`);

    return fetch(`https://hunterschools.myschoolapp.com/api/UserTask/Edit/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        api.nullifyIfZeroTaskSectionId({
          AssignedDate: BlackbaudDate.from(task.assignedDate),
          DueDate: BlackbaudDate.from(task.dueDate),
          SectionId: task.class.id,
          ShortDescription: task.title,
          TaskStatus: statusNum,
          UserId: await getStudentUserId(),
          UserTaskId: task.id,
        }),
      ),
    });
  },
  async deleteTask(id) {
    console.log(`Deleting task ${id}`);
    return fetch("https://hunterschools.myschoolapp.com/api/UserTask/Edit/", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  },
  /** @param {BlackbaudTask} task */
  async createTask(task) {
    console.log(`Creating task ${task.ShortDescription}`);
    const id = await fetch(
      "https://hunterschools.myschoolapp.com/api/UserTask/Edit/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(api.nullifyIfZeroTaskSectionId(task)),
      },
    ).then((r) => r.text());
    if (/\D/.test(id)) {
      console.error(
        `Invalid response to create task: "${id}". (Expected an id, ie number.)`,
      );
      return null;
    }
    return id;
  },
  /** @param {BlackbaudTask} task */
  async updateTask(task) {
    console.log(`Updating task ${task.UserTaskId}`);
    return fetch("https://hunterschools.myschoolapp.com/api/UserTask/Edit/", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(api.nullifyIfZeroTaskSectionId(task)),
    });
  },

  getClassColors: memo(
    /** @returns {Promise<Map<number, string>>} */
    async () =>
      fetch(
        "https://hunterschools.myschoolapp.com/api/AssignmentCenter/StudentAssignmentCenterSettingsGet?displayByDueDate=true",
      )
        .then(
          /** @returns { { SectionColors: { LeadSectionId: number, HexColor: string }[] } }*/
          (r) => r.json(),
        )
        .then((r) => r.SectionColors)
        .then((colors) =>
          colors.reduce(
            (map, { LeadSectionId, HexColor }) =>
              map.set(LeadSectionId, HexColor),
            new Map(),
          ),
        ),
  )[0],

  getAllAssignmentData: () =>
    fetch(
      "https://hunterschools.myschoolapp.com/api/assignment2/StudentAssignmentCenterGet?displayByDueDate=true",
    ).then(r => r.json()),

  getClasses: memo(
    /** @returns {Promise<Map<number, string>>} */
    async () =>
      api.getAllAssignmentData()
        .then((/** @type { { Sections: { LeadSectionId: number, GroupName: string }[] } */ { Sections: sections }) =>
          sections.reduce(
            (map, { LeadSectionId: id, GroupName: name }) => map.set(id, name),
            new Map(),
          ),
        ),
  )[0],
};
