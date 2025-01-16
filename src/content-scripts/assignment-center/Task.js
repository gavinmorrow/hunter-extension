const Task = {
  async populateAllIn(assignments) {
    const tasks = await api.getAllAssignmentData().then(
      assignments => Promise.all(
        assignments.DueToday.concat(
          assignments.DueTomorrow,
          assignments.DueThisWeek,
          assignments.DueNextWeek,
          assignments.DueAfterNextWeek,
          assignments.PastThisWeek,
          assignments.PastLastWeek,
          assignments.PastBeforeLastWeek,
        )
          .filter((a) => a.UserTaskId !== 0)
          .map(Task.parse)
          .map(Task.addColor),
      ),
      err => {
        reportError(err);
        // Allow the rest of the UI to work, just without tasks.
        return [];
      }
    );
    return assignments.filter((a) => !a.isTask).concat(tasks);
  },

  parse(t) {
    return {
      id: Number(t.UserTaskId),
      color: undefined,
      title: t.ShortDescription,
      link: null,
      description: null,
      status: Object.keys(api.statusNumMap).find(
        (k) => api.statusNumMap[k] === t.TaskStatus,
      ),
      // duplicated to handle both bc I can't figure out which one blackbaud
      // uses. It might be both???
      dueDate: BlackbaudDate.parse(t.DueDate ?? t.DateDue),
      assignedDate: BlackbaudDate.parse(t.AssignedDate ?? t.DateAssigned),
      maxPoints: null,
      isExtraCredit: false,
      class: {
        name: t.GroupName,
        id: Number(t.SectionId),
        link: `https://hunterschools.myschoolapp.com/app/student#academicclass/${t.SectionId}/0/bulletinboard`,
      },
      type: "My task",
      isTask: true,
      submissionMethod: null,
    };
  },

  async addColor(t) {
    return Assignment.addColor(t);
  }
};
