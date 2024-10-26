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
  /** @type {number?} */
  taskId;

  /** @type {Assignment?} */
  assignment;

  /** @type {(assignment: Assignment) => void} */
  updateAssignment;

  constructor(
    /** @type {number?} */ taskId,
    /** @type {Assignment?} */ assignment,
  ) {
    super();
    this.taskId = taskId;
    this.assignment = assignment;
    this.updateAssignment = this.#updateAssignment.bind(this);

    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `\
<style>
  ${this.#getStylesheet()}
</style>
<dialog id="modal">
  <form id="task-form" method="dialog">
    <input id="id" type="hidden"name="id">
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
<slot name="show-modal"></slot>
`;
  }

  connectedCallback() {
    this.#hydrateShowModal();
    this.#hydrateClassSelect();
    this.#hydrateFormSubmit();
  }

  #updateAssignment(assignment) {
    this.assignment = assignment;
    this.#refreshClassSelectSelectedOption();
  }

  #hydrateShowModal() {
    const slot = this.shadowRoot.querySelector("slot[name='show-modal']");
    const [btn] = slot.assignedElements();
    const modal = this.shadowRoot.getElementById("modal");
    btn?.addEventListener("click", () => {
      const id = this.shadowRoot.getElementById("id");
      id.value = this.taskId ?? "";

      /** @type {HTMLInputElement} */
      const title = this.shadowRoot.getElementById("title");
      title.placeholder = randomPlaceholder();
      title.value = this.assignment?.title ?? "";

      const dueDate = this.shadowRoot.getElementById("dueDate");
      dueDate.value = Calendar.asInputValue(
        this.assignment?.dueDate ?? tomorrow,
      );

      modal.showModal();
    });
  }

  async #hydrateClassSelect() {
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

  #refreshClassSelectSelectedOption() {
    const classSelect = this.shadowRoot.getElementById("class-select");
    for (const option of classSelect.querySelectorAll("option")) {
      const shouldSelect = option.value === String(this.assignment?.class.id);
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
          TaskStatus: statusNumMap[this.assignment?.status] ?? -1,
          SectionId: taskRaw.class,
          UserId: Number(await getStudentUserId()),
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
}
:invalid {
  border-color: red;
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
