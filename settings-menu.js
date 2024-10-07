const settingsOptions = {
  loginAutomatically: {
    desc: "Automatically click the buttons required to login.",
    type: {
      hunter: "Automatically login to the hunter website.",
      blackbaud: "Automatically login on blackbaud.",
      google: {
        email:
          "Automatically select your email in the google login page when logging in to hunter.",
        password:
          "Automatically press the next button on the google login page (after your password is autofilled) when logging into hunter.",
      },
    },
  },
  assignmentCenter: {
    desc: "Tweaks and improvements to the assignment center!",
    type: {
      enabled: "Enable assignment center improvements.",
      reloadOnBroken:
        "Automatically reload the page when the assignment center is broken (ie blank).",
      hideLowerNavbar: "Hide the bottommost navigation bar (it's redundant).",

      customUi: {
        desc: "An entirely new (and significantly better) user interface for the assignment center!",
        type: {
          enabled: "Enable the new UI.",
          statusColors: {
            desc: "The color for each assignment status. Can be any valid CSS color.",
            type: {
              Overdue: "",
              Missing: "",
              "To do": "",
              "In progress": "",
              Completed: "",
              Graded,
            },
          },
        },
      },
      calendar: {
        desc: "Bug fixes for your good ol' calendar view.",
        type: {
          fixCalendarHeaderOverflow:
            "Prevents the date in the calendar header from becoming partially hidden when the line wraps.",
        },
      },
      filter: {
        desc: "Automatically change your filters for you. Note: this does not affect the custom UI.",
        type: {
          enabled: "",
          autoNotCompleted: "Automatically hide completed assignments.",
        },
      },
    },
  },
};

class SettingsMenu extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    shadow.appendChild(document.createElement("style"));

    const settingsBtn = document.createElement("button");
    settingsBtn.id = "settings-btn";
    settingsBtn.textContent = "Settings";
    shadow.appendChild(settingsBtn);

    const modal = document.createElement("dialog");
    modal.id = "modal";
    shadow.appendChild(modal);
  }
  async connectedCallback() {}

  #createModalElements() {
    let elems = [];
  }
  #hydrateModal(settings) {}
}

if (!customElements.get("settings-menu")) {
  customElements.define("settings-menu", SettingsMenu);
}
