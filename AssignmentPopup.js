class AssignmentPopup extends HTMLElement {
  /** @type {Assignment} */
  assignment;

  constructor(assignment) {
    super();
    this.assignment = assignment;
    this.updateAssignment = this.#updateAssignment.bind(this);
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    const style = document.createElement("style");
    style.textContent = this.#getStylesheet();
    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(this.#createRoot());
  }

  #createRoot() {
    const root = document.createElement("article");
    root.id = "popup-root";

    // get assignment description, if available
    const descElem = document.createElement("div");
    descElem.id = "desc";
    // do NOT escape, b/c this content is taken directly from the innerHTML
    // of the full description page
    descElem.innerHTML = this.#getDesc();
    root.appendChild(descElem);

    return root;
  }

  #updateAssignment(assignment) {
    this.assignment = assignment;
    this.shadowRoot.querySelector("article").replaceWith(this.#createRoot());
  }

  #getDesc() {
    const rawDesc = this.assignment.description;
    if (rawDesc === null || rawDesc === undefined) return "<i>Loading...</i>";
    else if (rawDesc === "") return "<i>No description</i>";
    else return rawDesc;
  }

  #getStylesheet() {
    return `\
#popup-root {
  --color-bg: oklch(from var(--color-bg-box) calc(l*120%) c h / 88%);
  --len-padding: calc(var(--base-padding) + var(--width-class-color));

  position: absolute;
  top: 100%;
  left: var(--width-class-color);

  min-width: 22em;

  box-sizing: border-box;
  z-index: 1;

  background-color: var(--color-bg);
  box-shadow: 0 0.5em 1em 0 var(--color-bg);
  backdrop-filter: blur(0.5em);

  padding: var(--len-padding);
  border-radius: var(--len-padding);

  & #desc > p:first-of-type {
    margin-top: 0;
  }
}
`;
  }
}

if (!customElements.get("assignment-popup")) {
  customElements.define("assignment-popup", AssignmentPopup);
}
