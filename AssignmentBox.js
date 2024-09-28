class AssignmentBox extends HTMLElement {
  /** @type {Assignment} */
  assignment;

  /** @type {Settings} */
  settings;

  /** @type {AssignmentPopup} */
  popup;

  /**
   * @param {Assignment} assignment
   * @param {Settings} settings
   */
  constructor(assignment, settings) {
    super();
    this.assignment = assignment;
    this.settings = settings;
    this.popup = new AssignmentPopup(this.assignment);
  }

  connectedCallback() {
    // Create a shadow root
    const shadow = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = this.#getStylesheet();
    shadow.appendChild(style);

    const wrapper = document.createElement("article");
    const root = document.createElement("div");

    // add classes for majors and completed assignments
    if (this.assignment.details.type.indexOf("Major") > -1)
      root.classList.add("type-major");
    if (this.#shouldCollapse()) root.classList.add("collapse");

    // make entire card clickable to open link
    // see <https://inclusive-components.design/cards/> and <https://css-tricks.com/block-links-the-search-for-a-perfect-solution/>
    root.style.cursor = "pointer";
    root.addEventListener("click", (e) => {
      const link = root.querySelector("#title a");
      if (e.target === link || document.getSelection().toString() !== "")
        return;
      else link.click();
    });

    // add the element for assignment title
    root.appendChild(this.#makeTitleElem());

    wrapper.appendChild(root);

    // add popup
    wrapper.appendChild(this.popup);
    shadow.appendChild(wrapper);
  }

  #makeTitleElem() {
    const e = document.createElement("p");
    e.id = "title";
    const a = document.createElement("a");
    a.textContent = this.assignment.title;
    if (this.#shouldCollapse()) a.title = this.assignment.title;
    a.href = this.assignment.link;
    e.appendChild(a);
    return e;
  }

  #assignmentClassColor() {
    if (this.assignment.color === "") {
      return "oklch(from var(--color-bg-box) calc(l*200%) c h)";
    } else {
      return this.assignment.color;
    }
  }

  #assignmentStatusColor() {
    const status = this.assignment.status;
    const colors = this.settings.assignmentCenter.customUi.statusColors;

    return colors[status] ?? "oklch(from var(--color-bg-box) calc(l*150%) c h)";
  }

  #shouldCollapse() {
    return this.assignment.status === "Completed";
  }

  #getStylesheet() {
    return `\
article {
  position: relative;

  &>div {
    position: relative;
    background-color: ${this.#assignmentStatusColor()};
    box-sizing: border-box;

    --base-padding: 0.25em;
    --width-class-color: 0.5em;
    padding: var(--base-padding);
    padding-left: calc(var(--base-padding) + var(--width-class-color));
    padding-right: calc(var(--base-padding) + var(--width-class-color));

    --border-width: 2px;
    --inner-border-width: calc(var(--border-radius) - 2px);
    --border-radius: var(--base-padding);
    border-radius: var(--border-radius);

    /* Thanks to <https://css-tricks.com/restricting-a-pseudo-element-to-its-parents-border-box/> */
    clip-path: inset(0 round 0.25em);
  }

  &>div::before, &>div::after {
    content: "";
    background-color: ${this.#assignmentClassColor()};
    position: absolute;
    top: 0;
    bottom: 0;
    width: var(--width-class-color);
  }
  &>div::before { left: 0; border-radius: var(--inner-border-width) 0 0 var(--inner-border-width); }
  &>div::after { right: 0; border-radius: 0 var(--inner-border-width) var(--inner-border-width) 0; }

  &.type-major {
    border: var(--border-width) solid yellow;
  }

  &.collapse #title {
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }

  &:focus-within>div, &:hover>div {
    background-color: oklch(from ${this.#assignmentStatusColor()} calc(l + 0.07) c h);
  }

  &:not(:hover, :focus-within) assignment-popup {
    display: none;
  }
}

p {
  margin: 0;
}

a {
  color: var(--color-text-link);
  text-decoration: none;

  &:hover, &:focus {
    text-decoration: underline;
    outline: none;
  }
}
`;
  }
}

if (!customElements.get("assignment-box")) {
  customElements.define("assignment-box", AssignmentBox);
}
