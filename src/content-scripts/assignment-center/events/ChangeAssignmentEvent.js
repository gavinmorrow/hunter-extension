/**
 * An event that indicates that an assignment has changes that should be applied.
 *
 * Dispatched from a child of <assignment-center>, and handled by <assignment-center>.
 */
class ChangeAssignmentEvent extends Event {
  /**
   * The assignment or task id.
   * @type {number}
   */
  id;
  /** @type {boolean} */
  isTask;
  /** @type {Assignment} */
  changes;

  constructor(
    /** @type {number} */ id,
    /** @type {boolean} */ isTask,
    /** @type {Assignment} */ changes,
  ) {
    super("change-assignment");
    this.id = id;
    this.isTask = isTask;
    this.changes = changes;
  }
}
