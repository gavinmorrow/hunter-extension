///=================///
///=== TAB STATE ===///
///=================///
/**
 * @typedef {number} TabId
 * @typedef {{[any]: any}} State
 */

/**
 * Get or set tab state.
 * @param {number} tabId The tab ID
 * @param {any?} newValue If present (ie `!= undefined`), the value to set the state to. If it is `null`, then it will delete the entry.
 * @returns {any?} If newValue was present, void. Otherwise, the value for the tab ID.
 */
const tabState = async (tabId, newValue) => {
  const tabName = `state.${tabId}`;
  switch (newValue) {
    case undefined:
      return (await browser.storage.session.get({ [tabName]: {} }))[tabName];
    case null:
      return await browser.storage.session.remove(tabName);
    default:
      await browser.storage.session.set({ [tabName]: newValue });
      return tabState(tabId);
  }
};

/** Allows content scripts to keep persistent state across tab reloads. */
const tabStateListener = async (msg, sender) => {
  const tabId = sender.tab.id;
  const getCurrTabState = async () => await tabState(tabId);

  switch (msg.type) {
    case "state.get":
      return getCurrTabState();
    case "state.set":
      const currTabState = await getCurrTabState();
      await tabState(tabId, { ...currTabState, ...msg.data });
      return getCurrTabState();
    case "state.delete":
      await tabState(tabId, null);
      return;
    default:
      console.error(`Unknown message type ${msg.type}`);
  }
};

///================///
///=== SETTINGS ===///
///================///
const defaultSettings = {
  loginAutomatically: {
    hunter: true,
    blackbaud: true,
    google: {
      email: true,
      password: true,
    },
  },
  assignmentCenter: {
    enabled: true,
    customUi: {
      enabled: true,
      statusColors: {
        // "To do": "oklch(42% 0.07 86)" /* yellow */,
        toDo: "oklch(42% 0.17 214)" /* blue */,
        inProgress: "oklch(42% 0.17 214)" /* blue */,
        completed: "oklch(42% 0.17 146)" /* grey */,
        graded: "oklch(42% 0.17 146)" /* green */,
        missing: "oklch(42% 0.17 0)" /* red */,
        overdue: "oklch(42% 0.17 0)" /* red */,
      },
    },
    calendar: {
      enabled: true,
      fixCalendarHeaderOverflow: true,
    },
    list: {
      enabled: true,
    },
    filter: {
      enabled: true,
      autoNotCompleted: true,
    },
    reloadOnBroken: true,
    hideLowerNavbar: true,
    statusColors: {
      todo: "blue",
      inProgress: "yellow",
      completed: "green",
    },
  },
};

/** @param {Object} a @param {Object} b */
const meshObjects = (a = {}, b = {}) => {
  const o = structuredClone(a);
  for (const p in b) {
    if (Object.hasOwn(o, p) && typeof o[p] === "object")
      o[p] = meshObjects(o[p], b[p]);
    else o[p] = b[p];
  }
  console.log({ a, b, o });
  return o;
};

const getSettings = async () =>
  meshObjects(defaultSettings, (await browser.storage.local.get()).settings);

const setSettings = async (newValue) =>
  browser.storage.local.set({
    settings: newValue,
  });

const updateSettings = async (partial) =>
  browser.storage.local.get().then(({ settings: current }) => {
    console.log({ current, partial });
    setSettings(meshObjects(current, partial));
  });

const resetSettings = async () => setSettings({});

const settingsListener = async (msg, sender) => {
  switch (msg.type) {
    case "settings.get":
      return getSettings();
    case "settings.set":
      await setSettings(msg.data);
      return getSettings();
    case "settings.update":
      await updateSettings(msg.data);
      return getSettings();
    case "settings.reset":
      await resetSettings();
      return getSettings();
  }
};

browser.runtime.onMessage.addListener(async (msg, sender) => {
  const type = msg.type.split(".")[0];
  switch (type) {
    case "state":
      return tabStateListener(msg, sender);
    case "settings":
      return settingsListener(msg, sender);
    default:
      console.error(`Unknown message type ${msg.type}`);
  }
});