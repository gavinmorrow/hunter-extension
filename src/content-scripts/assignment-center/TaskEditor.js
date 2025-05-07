const PLACEHOLDERS = [
  "Complain about admin",
  "Procrastinate the FLE",
  "Sneak in the main entrance",
  "Sign up for HawkHacks",
  "Submit a new funny placeholder",
  'Look up how to pronounce "indict"',
  "Figure out what Blackbaud broke",
  "Go to Sing's (or is it Singh's?)",
  "Be held 5min late after 9th period",
  "Cram before 3rd period Spanish",
  "Ignore the term paper due tomorrow",
  "Give Gavin feedback on Orion",
  "Do transgender operations on illegal aliens in prison",
  "Create concepts of a plan",
];
const randomPlaceholder = () =>
  PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];

/**
 * @typedef {Object} BlackbaudTask
 * @property {string} AssignedDate
 * @property {string} DueDate
 * @property {string} ShortDescription
 * @property {number} TaskStatus
 * @property {string} UserId
 * @property {string} UserTaskId
 */

class TaskEditor extends HTMLElement {
  /** @type {Assignment?} */
  #task;

  /** @type {(assignment: Assignment) => void} */
  updateAssignment;

  /** @type {() => void} */
  showModal;

  constructor(/** @type {Assignment?} */ task) {
    super();
    this.#task = task;
    this.updateAssignment = this.#updateAssignment.bind(this);
    this.showModal = this.#showModal.bind(this);

    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `\
<style>
  ${TaskEditor.#stylesheet}
</style>
<dialog id="modal">
  <form id="task-form" method="dialog">
    <input id="id" type="hidden" name="id">
    <label>
      Title
      <input required autofocus id="title" type="text" name="title">
    </label>
    <label>
      Class
      <select required name="class" id="class-select">
        <option value="0">None</option>
      </select>
    </label>
    <label>
      Due Date
      <input required id="dueDate" type="date" name="dueDate">
    </label>
    <div id="btns">
      <button type="submit" id="save" value="Save">Save</button>
      <button type="button" id="cancel">Cancel</button>
    </div>
  </form>
</dialog>
`;
  }

  connectedCallback() {
    this.#addClassesToSelect();
    this.#hydrateFormSubmit();
    this.#hydrateCancel();

    this.#updateAssignment(this.#task);
  }

  #updateAssignment(assignment) {
    this.#task = assignment;

    this.#refreshId();
    this.#refreshTitle();
    this.#refreshClassSelectSelectedOption();
    this.#refreshDueDate();
  }

  #showModal() {
    // I'm not sure why it's not, but the date input gets reset to blank after
    // closing the new task dialog and reopening it. So refresh it here.
    this.#refreshDueDate();

    this.shadowRoot.getElementById("title").placeholder = randomPlaceholder();
    this.shadowRoot.getElementById("modal").showModal();
  }

  async #addClassesToSelect() {
    const classSelect = this.shadowRoot.getElementById("class-select");
    try {
      const classes = await api.getClasses();
      for (const [id, name] of classes.entries()) {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = name;
        classSelect.appendChild(option);
      }
      this.#refreshClassSelectSelectedOption();
    } catch (err) {
      reportError(err);
    }
  }

  #refreshId() {
    this.shadowRoot.getElementById("id").value = this.#task?.id ?? "";
  }

  #refreshTitle() {
    this.shadowRoot.getElementById("title").value = this.#task?.title ?? "";
  }

  #refreshDueDate() {
    this.shadowRoot.getElementById("dueDate").value = Calendar.asInputValue(
      this.#task?.dueDate ?? Calendar.nextWeekday(),
    );
  }

  #refreshClassSelectSelectedOption() {
    const classSelect = this.shadowRoot.getElementById("class-select");
    for (const option of classSelect.querySelectorAll("option")) {
      const shouldSelect = option.value === String(this.#task?.class.id);
      option.selected = shouldSelect;
    }
  }

  #hydrateFormSubmit() {
    /** @type {HTMLFormElement} */
    const form = this.shadowRoot.getElementById("task-form");

    /** @type {HTMLDialogElement} */
    const modal = this.shadowRoot.getElementById("modal");
    modal.addEventListener("close", async (e) => {
      if (modal.returnValue === "Save") {
        // create task
        const formData = new FormData(form);
        const taskRaw = Object.fromEntries(Array.from(formData));
        const dueDate = `${Calendar.asBlackbaudDate(
          Calendar.fromInputValue(taskRaw.dueDate),
        )} 8:08 AM`;
        const task = {
          // Use the same value b/c that's how Blackbaud does it
          AssignedDate: dueDate,
          DueDate: dueDate,
          ShortDescription: taskRaw.title,
          TaskStatus: api.statusNumMap[this.#task?.status] ?? -1,
          SectionId: taskRaw.class,
          UserId: await getStudentUserId(),
          UserTaskId: taskRaw.id === "" ? undefined : Number(taskRaw.id),
        };
        this.#addTask(task);
      }

      // If the task isn't null, resetting will make the editor blank the next
      // time it's opened (when it should be showing the task)
      // ie only reset for the new task form
      if (this.#task == null) form.reset();
    });
  }

  #hydrateCancel() {
    this.shadowRoot
      .getElementById("cancel")
      .addEventListener("click", (e) =>
        this.shadowRoot.getElementById("modal").close("Cancel"),
      );
  }

  /**
   * Dispatch an event to add a task.
   * @param {BlackbaudTask} task
   */
  #addTask(task) {
    const event = new CreateTaskEvent(task);
    this.dispatchEvent(event);
  }

  static #stylesheet = `\
input, select {
  border: 1px solid transparent;
  max-width: 100%;
}
:invalid {
  border-color: red;
}

#title, #class-select {
  width: 40ch;
}

label {
  display: block;
}

#btns {
  display: flex;
  gap: 0.5ch;
}

button {
  border: none;
  flex-grow: 1;
}

#save       { background-color: oklch(35% 0.1 283); }
#save:hover { background-color: oklch(45% 0.1 283); }
#save:focus { background-color: oklch(50% 0.1 283); }
`;
}

if (!customElements.get("task-editor")) {
  customElements.define("task-editor", TaskEditor);
}
