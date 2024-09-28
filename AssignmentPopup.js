class AssignmentPopup extends HTMLElement {
  /** @type {Assignment} */
  assignment;

  constructor(assignment) {
    super();

    this.assignment = assignment;
  }

  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });
  }
}

if (!customElements.get("assignment-popup")) {
  customElements.define("assignment-popup", AssignmentPopup);
}
