const PLACEHOLDERS = [
  "Complain about admin",
  "Procrastinate the FLE",
  "Sneak in the main entrance",
  "Sign up for HawkHacks",
  "Submit a new funny placeholder",
  'Look up how to pronounce "indict"',
  "Figure out what Blackbaud broke",
  "Go to Sing's (or is it Signh's?)",
  "Be held 5min late after 9th period",
  "Cram before 3rd period Spanish",
  "Ignore the term paper due tomorrow",
  "Give Gavin feedback on the extension",
  "Do transgender operations on illegal aliens in prison",
  "Create concepts of a plan",
];
const randomPlaceholder = () =>
  PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];

const tomorrow = Calendar.offsetFromDay(new Date(), 1);

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
  ${this.#getStylesheet()}
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
    <input type="submit" value="Save">
    <input type="submit" value="Cancel">
  </form>
</dialog>
`;
  }

  connectedCallback() {
    this.#addClassesToSelect();
    this.#hydrateFormSubmit();

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
    const classes = await getClasses();
    for (const [id, name] of classes.entries()) {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = name;
      classSelect.appendChild(option);
    }
    this.#refreshClassSelectSelectedOption();
  }

  #refreshId() {
    this.shadowRoot.getElementById("id").value = this.#task?.id ?? "";
  }

  #refreshTitle() {
    this.shadowRoot.getElementById("title").value = this.#task?.title ?? "";
  }

  #refreshDueDate() {
    this.shadowRoot.getElementById("dueDate").value = Calendar.asInputValue(
      this.#task?.dueDate ?? tomorrow,
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
          TaskStatus: statusNumMap[this.#task?.status] ?? -1,
          SectionId: taskRaw.class,
          UserId: await getStudentUserId(),
          UserTaskId: taskRaw.id === "" ? undefined : Number(taskRaw.id),
        };
        this.#addTask(task);
      }

      form.reset();
    });
  }

  /**
   * Dispatch an event to add a task.
   * @param {BlackbaudTask} task
   */
  #addTask(task) {
    const event = new CreateTaskEvent(task);
    this.dispatchEvent(event);
  }

  #getStylesheet() {
    return `\
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
`;
  }
}

if (!customElements.get("task-editor")) {
  customElements.define("task-editor", TaskEditor);
}
