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

    // title
    const title = document.createElement("h2");
    title.textContent = this.assignment.title;
    root.appendChild(title);

    shadow.appendChild(root);
  }

  #getStylesheet() {
    return `\
#popup-root {
  --color-bg: oklch(from var(--color-bg-box) calc(l*120%) c h / 88%);
  --len-padding: calc(var(--base-padding) + var(--width-class-color));

  position: absolute;
  top: 100%;
  left: var(--width-class-color);

  width: calc(100% - 2 * var(--width-class-color));

  box-sizing: border-box;
  z-index: 1;

  background-color: var(--color-bg);
  box-shadow: 0 0.5em 1em 0 var(--color-bg);
  backdrop-filter: blur(0.5em);

  padding: var(--len-padding);
  border-radius: var(--len-padding);

  & h2 {
    font-size: medium;
    margin: 0;
  }
}
`;
  }
}

if (!customElements.get("assignment-popup")) {
  customElements.define("assignment-popup", AssignmentPopup);
}
