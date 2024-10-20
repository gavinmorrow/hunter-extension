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
    style.textContent = this.#getStylesheet();
    shadow.appendChild(style);

    const root = document.createElement("nav");
    root.id = "root";

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

    const newTask = document.createElement("button");
    newTask.textContent = "New task";
    root.appendChild(newTask);

    shadow.appendChild(root);
  }

  connectedCallback() {}

  #getStylesheet() {
    return `\
#root {
  --color-text: #eee;
  --color-border: #333;
  --color-bg-root: #111;
  --color-bg-btn: oklch(from var(--color-bg-root) calc(l*120%) c h);

  color: var(--color-text);
  background-color: var(--color-bg-root);

  display: flex;
  flex-direction: row;
  gap: 0.25em;

  /* FIXME: if both assignment-center and this use margin, then it will
   * collapse automatically. except then we need a container for styles.
   * that might be a good idea anyways bc the colors are duplicated here.
   */
  padding: 1em;
  padding-bottom: 0;

  & button, & a {
    background-color: var(--color-bg-btn);
    border: 1px solid var(--color-border);
    color: var(--color-text);

    padding: 0.25em;

    &:hover, &:focus-visible {
      background-color: oklch(from var(--color-bg-btn) calc(l*200%) c h);
    }
  }
}
`;
  }
}
if (!customElements.get("toolbar-menu")) {
  customElements.define("toolbar-menu", ToolbarMenu);
}
