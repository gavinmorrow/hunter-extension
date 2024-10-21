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

  /** @type {(task: BlackbaudTask) => Promise<void>} */
  #addTask;

  /** @param {number?} taskId @param {(task: BlackbaudTask) => Promise<void> addTask} */
  constructor(taskId, addTask) {
    super();
    this.taskId = taskId;
    this.#addTask = addTask;

    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `\
<style>
  ${this.#getStylesheet()}
</style>
<dialog id="modal">
  <form id="task-form" method="dialog">
    <input type="hidden" name="id" value="${taskId ?? ""}">
    <label>
      Title
      <input required autofocus type="text" name="title" placeholder="${randomPlaceholder()}">
    </label>
    <label>
      Class
      <select required name="class" id="class-select">
        <option value="0">None</option>
      </select>
    </label>
    <label>
      Due Date
      <input required type="date" name="dueDate" value="${Calendar.asInputValue(tomorrow)}">
    </label>
    <label>
      Due Time
      <input required type="time" name="dueTime" value="08:08">
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

  #hydrateShowModal() {
    const slot = this.shadowRoot.querySelector("slot[name='show-modal']");
    const [btn] = slot.assignedElements();
    const modal = this.shadowRoot.getElementById("modal");
    btn?.addEventListener("click", () => modal.showModal());
  }

  #hydrateClassSelect() {
    // todo
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
        )} ${Calendar.to12HourTimeInputValue(taskRaw.dueTime)}`;
        const task = {
          // Use the same value b/c that's how Blackbaud does it
          AssignedDate: dueDate,
          DueDate: dueDate,
          ShortDescription: taskRaw.title,
          TaskStatus: -1,
          UserId: Number(await getStudentUserId()),
          UserTaskId: taskRaw.id === "" ? undefined : Number(taskRaw.id),
        };
        await this.#addTask(task);
      }

      form.reset();
    });
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
