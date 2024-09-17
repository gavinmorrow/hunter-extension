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
      console.log(
        "returning",
        (await browser.storage.session.get({ [tabName]: {} }))[tabName],
      );
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
    fixCalendarHeaderOverflow: true,
    fullStatusColors: false,
    statusColors: {
      todo: "blue",
      inProgress: "yellow",
      completed: "green",
    },
  },
};

const getSettings = async () =>
  (await browser.storage.local.get({ settings: defaultSettings })).settings;

const setSettings = async (newValue) =>
  browser.storage.local.set({ settings: { ...newValue, ...defaultSettings } });

const resetSettings = async () => setSettings({});

const settingsListener = async (msg, sender) => {
  switch (msg.type) {
    case "settings.get":
      console.log(await getSettings());
      return getSettings();
    case "settings.set":
      await setSettings(msg.data);
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
