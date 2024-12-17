/**
 * An event that indicates a new task should be created.
 *
 * Dispatched from a child of <assignment-center>, and handled by <assignment-center>.
 */
class CreateTaskEvent extends Event {
  /** @type {BlackbaudTask} */
  task;

  constructor(/** @type {BlackbaudTask */ task) {
    super("create-task", { bubbles: true, composed: true });
    this.task = task;
  }
}
