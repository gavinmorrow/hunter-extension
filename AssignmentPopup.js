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
    style.textContent = this.#getStylesheet();
    shadow.appendChild(style);

    const root = document.createElement("article");
    root.id = "popup-root";
    shadow.appendChild(root);
  }

  #getStylesheet() {
    return `\
#popup-root {
  position: absolute;
  top: 0;
  left: 0;
  width: 10em;
  height: 10em;
  background-color: grey;
  z-index: 1000;
}
`;
  }
}

if (!customElements.get("assignment-popup")) {
  customElements.define("assignment-popup", AssignmentPopup);
}
