class AssignmentPopup extends HTMLElement {
  /** @type {Assignment} */
  assignment;

  constructor(assignment) {
    super();

    this.assignment = assignment;
  }

  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = this.getStylesheet();
    shadow.appendChild(style);
  }

  getStylesheet() {
    return `\
`;
  }
}

if (!customElements.get("assignment-popup")) {
  customElements.define("assignment-popup", AssignmentPopup);
}
