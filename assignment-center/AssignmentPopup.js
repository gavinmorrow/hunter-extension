class AssignmentPopup extends HTMLElement {
  /** @type {Assignment} */
  assignment;

  /** @type {(changes: Assignment) => void} */
  #setAssignment;

  /**
   * @param {Assignment} assignment
   * @param {(changes: Assignment) => void} setAssignment
   */
  constructor(assignment, setAssignment) {
    super();
    this.assignment = assignment;
    this.#setAssignment = setAssignment;

    this.updateAssignment = this.#updateAssignment.bind(this);

    // create DOM
    const shadow = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = this.#getStylesheet();
    shadow.appendChild(style);

    const root = document.createElement("article");
    root.id = "popup-root";

    // assignment status
    const statusBtn = document.createElement("button");
    statusBtn.id = "status-btn";
    statusBtn.addEventListener("click", (e) => {
      this.#setAssignment({ status: this.#nextStatus() });
    });
    root.appendChild(statusBtn);

    // assignment title
    const titleElem = document.createElement("h2");
    titleElem.id = "title";
    root.appendChild(titleElem);

    // assignment description
    const descElem = document.createElement("div");
    descElem.id = "desc";
    root.appendChild(descElem);

    shadow.appendChild(root);
  }

  connectedCallback() {
    this.#updateAssignment(this.assignment);
  }

  #hydrateStatus() {
    const statusBtn = this.shadowRoot.getElementById("status-btn");
    statusBtn.textContent = "Mark as ";
    if (this.#nextStatus() == null) statusBtn.hidden = true;
    else statusBtn.textContent += this.#nextStatus();
  }

  #hydrateTitle() {
    const titleElem = this.shadowRoot.getElementById("title");
    titleElem.textContent = this.assignment.title;
  }

  #hydrateDescription() {
    // get assignment description, if available
    const descElem = this.shadowRoot.getElementById("desc");
    // do NOT escape, b/c this content is taken directly from the innerHTML
    // of the full description page
    descElem.innerHTML = this.#getDesc();
  }

  #updateAssignment(assignment) {
    this.assignment = assignment;
    this.#hydrateStatus();
    this.#hydrateTitle();
    this.#hydrateDescription();
  }

  #getDesc() {
    const rawDesc = this.assignment.description;
    if (rawDesc === null || rawDesc === undefined) return "<i>Loading...</i>";
    else if (rawDesc === "") return "<i>No description</i>";
    else return rawDesc;
  }

  /** @returns {Status?} The status to toggle to, or null if the status should not be toggled. */
  #nextStatus() {
    switch (this.assignment.status) {
      case "Overdue":
      case "Missing":
      case "To do":
      case "In progress":
        return "Completed";
      case "Completed":
        return "To do";
      default:
        return null;
    }
  }

  #getStylesheet() {
    return `\
#popup-root {
  --color-bg: oklch(from var(--color-bg-box) calc(l*150%) c h / 88%);
  --len-padding: calc(var(--base-padding) + var(--width-class-color));

  position: absolute;
  top: 100%;
  left: var(--width-class-color);

  min-width: 22em;

  box-sizing: border-box;
  z-index: 2;

  background-color: var(--color-bg);
  box-shadow: 0 0.5em 1em 0 black;
  backdrop-filter: blur(0.5em);

  padding: var(--len-padding);
  border-radius: var(--len-padding);

  & #desc > p:first-of-type {
    margin-top: 0;
  }

  & #title {
    font-size: medium;
    margin: 0;
    margin-top: 0.5em;
    margin-bottom: 0.25em;
  }
  & #desc > p:first-of-type {
    margin-top: 0;
  }
}

a {
  /* Prevent the color from being unreadable */
  color: oklch(64% 0.2 262);
}
`;
  }
}

if (!customElements.get("assignment-popup")) {
  customElements.define("assignment-popup", AssignmentPopup);
}
