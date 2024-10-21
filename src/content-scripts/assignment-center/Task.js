const Task = {
  async populateAllIn(assignments) {
    const allAssignmentData = await fetch(
      "https://hunterschools.myschoolapp.com/api/assignment2/StudentAssignmentCenterGet",
    ).then((res) => res.json());
    const colors = await getClassColors();
    let tasks = allAssignmentData.DueToday.concat(
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
      .map((t) => ({ ...t, color: colors.get(t.class.id) }));
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
      dueDate: BlackbaudDate.parse(t.DateDue),
      assignedDate: BlackbaudDate.parse(t.DateAssigned),
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
};
