class ToolbarMenu extends HTMLElement {
  constructor(elems) {
    super();

    this.elems = elems;

    this.#createDom();
  }

  #createDom() {
    const shadow = this.attachShadow({ mode: "open" });

    // Prevent blackbaud from throwing a fit in the console
    shadow.addEventListener("click", (e) => e.stopPropagation());
    shadow.addEventListener("mousedown", (e) => e.stopPropagation());

    const style = document.createElement("style");
    style.textContent = ToolbarMenu.#stylesheet;
    shadow.appendChild(style);

    const root = document.createElement("nav");
    root.id = "root";

    const prependBtn = document.createElement("button");
    prependBtn.id = "prepend";
    prependBtn.textContent = "Prepend by 1 week";
    prependBtn.addEventListener("click", () => {
      this.elems.assignmentCenter.extendCalendarGrid(-1);
    });
    root.appendChild(prependBtn);

    const settings = new SettingsMenu();

    // Use a slot so that it gets the styling
    const showBtn = document.createElement("button");
    showBtn.textContent = "Settings";
    showBtn.slot = "show-modal";
    settings.appendChild(showBtn);

    root.appendChild(settings);
    // construct close button
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Toggle custom UI";
    closeBtn.addEventListener("click", (_e) => {
      this.elems.oldElem.hidden = !this.elems.oldElem.hidden;
      this.elems.assignmentCenter.hidden = !this.elems.assignmentCenter.hidden;
    });
    root.appendChild(closeBtn);

    // Assignments cache button
    // When this is reliable enough, remove
    const clearAssignmentsCacheBtn = document.createElement("button");
    clearAssignmentsCacheBtn.textContent = "Clear assignments cache";
    // clearAssignmentsCacheBtn.slot = "show-modal";
    clearAssignmentsCacheBtn.addEventListener("click", () =>
      clearAssignmentsCache()
        .catch((e) => reportError(`Could not clear assignments cache: ${e}`))
        .then(() => location.reload()),
    );
    // root.appendChild(clearAssignmentsCacheBtn);

    // Open changelog button
    const openChangelogBtn = document.createElement("a");
    openChangelogBtn.href = "https://gavinmorrow.github.io/orion/CHANGELOG";
    openChangelogBtn.target = "_blank";
    openChangelogBtn.text = "Open changelog";
    root.appendChild(openChangelogBtn);

    // task editor
    root.append(this.#createTaskEditor());

    const versionTxt = document.createElement("span");
    versionTxt.id = "version";
    versionTxt.textContent = `Orion v${VERSION}`;
    root.appendChild(versionTxt);

    shadow.appendChild(root);
  }

  #createTaskEditor() {
    const taskEditor = new TaskEditor(null);
    taskEditor.addEventListener(
      "create-task",
      (/** @type {CreateTaskEvent} */ e) => {
        // Clone the task to prevent error:
        // InvalidStateError: An attempt was made to use an object that is not, or is no longer, usable
        this.elems.assignmentCenter.dispatchEvent(new CreateTaskEvent(e.task));
        e.stopPropagation();
      },
    );

    const newTaskBtn = document.createElement("button");
    newTaskBtn.textContent = "New task";
    newTaskBtn.slot = "show-modal";
    newTaskBtn.addEventListener("click", (_) => taskEditor.showModal());

    const div = document.createElement("div");
    div.append(newTaskBtn, taskEditor);

    return div;
  }

  connectedCallback() {}

  static #stylesheet = `\
#root {
  --color-text: #eee;
  --color-border: #333;
  --color-bg-root: #111;

  color: var(--color-text);
  background-color: var(--color-bg-root);

  display: flex;
  flex-flow: row wrap;
  gap: 0.25em;

  /* FIXME: if both assignment-center and this use margin, then it will
   * collapse automatically. except then we need a container for styles.
   * that might be a good idea anyways bc the colors are duplicated here.
   */
  padding: 1em;
  padding-bottom: 0;

  & button, & a { ${buttonStylesInner} }

  & #version {
    /* Center vertically and push to right edge. */
    margin: auto;
    margin-right: 0;

    /* Italics */
    font-style: italic;

    /* Dim text a bit to make it stand out less */
    color: #aaa;
  }
}
`;
}
if (!customElements.get("toolbar-menu")) {
  customElements.define("toolbar-menu", ToolbarMenu);
}
