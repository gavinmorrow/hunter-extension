class AssignmentBox extends HTMLElement {
  /** @type {Assignment} */
  assignment;

  /** @type {(changes: Assignment) => void} */
  #setAssignment;

  /** @type {Settings} */
  settings;

  /** @type {AssignmentPopup} */
  popup;

  /**
   * @param {Assignment} assignment
   * @param {(changes: Assignment) => void} setAssignment
   * @param {Settings} settings
   */
  constructor(assignment, setAssignment, settings) {
    super();
    this.assignment = assignment;
    this.#setAssignment = setAssignment;
    this.settings = settings;
    this.popup = new AssignmentPopup(
      this.assignment,
      this.#setAssignment.bind(this),
    );
    this.updateAssignment = this.#updateAssignment.bind(this);

    // create DOM
    // Create a shadow root
    const shadow = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    shadow.appendChild(style);

    const wrapper = document.createElement("article");
    const root = document.createElement("div");
    root.id = "root";

    // add the element for assignment title
    root.appendChild(this.#createTitleElem());

    wrapper.appendChild(root);

    // add popup
    wrapper.appendChild(this.popup);

    shadow.appendChild(wrapper);
  }

  connectedCallback() {
    this.#updateAssignment(this.assignment);
  }

  #updateAssignment(assignment) {
    this.assignment = assignment;
    this.#hydrateStyles();
    this.#hydrateTitleElem();
    this.popup.updateAssignment(assignment);
  }

  #hydrateStyles() {
    // add classes for majors and completed assignments
    const root = this.shadowRoot.getElementById("root");

    if (this.#isMajor()) root.classList.add("type-major");
    else root.classList.remove("type-major");

    if (this.#shouldCollapse()) root.classList.add("collapse");
    else root.classList.remove("collapse");

    const style = this.shadowRoot.querySelector("style");
    style.textContent = this.#getStylesheet();
  }

  #createTitleElem() {
    const e = document.createElement("p");
    e.id = "title";
    e.appendChild(document.createElement("a"));
    return e;
  }

  #hydrateTitleElem() {
    const titleElem = this.shadowRoot.querySelector("#title a");

    titleElem.textContent = this.assignment.title;
    if (this.#shouldCollapse()) titleElem.title = this.assignment.title;

    titleElem.href = this.assignment.link;
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

  #isMajor() {
    return this.assignment.details.type.indexOf("Major") > -1;
  }

  #getStylesheet() {
    return `\
article {
  position: relative;

  --base-padding: 0.25em;
  --width-class-color: 0.5em;

  --border-width: 2px;
  --inner-border-width: calc(var(--border-radius) - 2px);
  --border-radius: var(--base-padding);

  &>div {
    position: relative;
    background-color: ${this.#assignmentStatusColor()};
    box-sizing: border-box;

    padding: var(--base-padding);
    padding-left: calc(var(--base-padding) + var(--width-class-color));
    padding-right: calc(var(--base-padding) + var(--width-class-color));

    border-radius: var(--border-radius);

    /* Thanks to <https://css-tricks.com/restricting-a-pseudo-element-to-its-parents-border-box/> */
    clip-path: inset(0 round 0.25em);

    &::before, &::after {
      content: "";
      background-color: ${this.#assignmentClassColor()};
      position: absolute;
      top: 0;
      bottom: 0;
      width: var(--width-class-color);
    }
    &::before { left: 0; border-radius: var(--inner-border-width) 0 0 var(--inner-border-width); }
    &::after { right: 0; border-radius: 0 var(--inner-border-width) var(--inner-border-width) 0; }

    &.type-major {
      border: var(--border-width) solid yellow;
    }

    &.collapse #title {
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }
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
