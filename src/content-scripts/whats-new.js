const whatsNewViewed = async () => {
  const latestViewedVersion = await browser.runtime.sendMessage({
    type: "whatsNew.getViewedVersion",
  });
  return latestViewedVersion === VERSION;
};

const setWhatsNewViewed = async () => browser.runtime.sendMessage({
  type: "whatsNew.setViewedVersion",
  data: VERSION,
});

whatsNewViewed()
  .then(async isViewed => {
    if (!isViewed || true) {
      await setWhatsNewViewed();
      const shouldPopup = confirm(`Hunter extension has been updated to version ${VERSION}! Open what's new page?`);
      if (shouldPopup) {
        const modal = new WhatsNewModal();
        document.body.appendChild(modal);
        modal.open();
      }
    }
  })
  .catch(reportError);

class WhatsNewModal extends HTMLElement {
  constructor() {
    super();

    // See firefox bug <https://bugzilla.mozilla.org/show_bug.cgi?id=1716685>
    this.open = this.#open;
    this.close = this.#close;

    this.attachShadow({ mode: "open" });

    // Prevent blackbaud from throwing a fit in the console
    this.shadowRoot.addEventListener("click", (e) => e.stopPropagation());
    this.shadowRoot.addEventListener("mousedown", (e) => e.stopPropagation());

    const style = document.createElement("style");
    style.textContent = this.#getStylesheet();
    this.shadowRoot.appendChild(style);
  }

  connectedCallback() {
    const modal = document.createElement("dialog");
    modal.id = "modal";

    const wrapper = document.createElement("div");
    wrapper.id = "wrapper";

    const currentVersionElem = document.createElement("p");
    currentVersionElem.id = "curr-version";
    currentVersionElem.textContent = `Current version: v${VERSION}`;
    wrapper.appendChild(currentVersionElem);

    const iframe = document.createElement("iframe");
    iframe.src = `https://gavinmorrow.github.io/hunter-extension/CHANGELOG#v${VERSION.replaceAll(".", "")}`;
    iframe.title = "Changelog";
    wrapper.appendChild(iframe);

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    closeBtn.id = "close";
    closeBtn.autofocus = true;
    closeBtn.addEventListener("click", () => this.#close());
    wrapper.appendChild(closeBtn);

    modal.appendChild(wrapper);
    this.shadowRoot.appendChild(modal);
  }

  #open() {
    this.shadowRoot.getElementById("modal").showModal();
  }

  #close() {
    this.shadowRoot.getElementById("modal").close();
  }

  #getStylesheet() {
    return `\
#modal {
  width: calc(100vw - 10vmin);
  height: calc(100vh - 10vmin);

  padding: 0;
  border-radius: 0.5em;

  & > #wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;

    & > #curr-version {
      margin: 0;
      text-align: center;
    }

    & > iframe {
      display: block;
      flex-grow: 1;

      border: none;
    }

    & > #close {
      background-color: #336;

      &:hover, &:focus, &:focus-within {
        background-color: #55a;
      }
    }
  }
`;
  }
}
if (!customElements.get("whats-new-modal")) {
  customElements.define("whats-new-modal", WhatsNewModal);
}
