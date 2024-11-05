const Task = {
  async populateAllIn(assignments) {
    const allAssignmentData = await fetch(
      "https://hunterschools.myschoolapp.com/api/assignment2/StudentAssignmentCenterGet",
    ).then((res) => res.json());
    const tasks = await Promise.all(
      allAssignmentData.DueToday.concat(
        allAssignmentData.DueTomorrow,
        allAssignmentData.DueThisWeek,
        allAssignmentData.DueNextWeek,
        allAssignmentData.DueAfterNextWeek,
        allAssignmentData.PastThisWeek,
        allAssignmentData.PastLastWeek,
        allAssignmentData.PastBeforeLastWeek,
      )
        .filter((a) => a.UserTaskId !== 0)
        .map(Task.parse)
        .map(Task.addColor),
    );
    return assignments.filter((a) => !a.isTask).concat(tasks);
  },

  parse(t) {
    return {
      id: t.UserTaskId,
      color: undefined,
      title: t.ShortDescription,
      link: null,
      description: null,
      status: Object.keys(statusNumMap).find(
        (k) => statusNumMap[k] === t.TaskStatus,
      ),
      // duplicated to handle both bc I can't figure out which one blackbaud
      // uses. It might be both???
      dueDate: BlackbaudDate.parse(t.DueDate ?? t.DateDue),
      assignedDate: BlackbaudDate.parse(t.AssignedDate ?? t.DateAssigned),
      maxPoints: null,
      isExtraCredit: false,
      class: {
        name: t.GroupName,
        id: t.SectionId,
        link: `https://hunterschools.myschoolapp.com/app/student#academicclass/${t.SectionId}/0/bulletinboard`,
      },
      type: "My task",
      isTask: true,
      submissionMethod: null,
    };
  },

  // A seperate function so that `parse` can be non-async.
  async addColor(t) {
    const colors = await getClassColors();
    return { ...t, color: colors.get(Number(t.class.id)) };
  },
};
