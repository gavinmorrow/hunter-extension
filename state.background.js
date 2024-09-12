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
      return await browser.storage.session.set({ [tabName]: newValue });
  }
};

browser.runtime.onMessage.addListener(
  /**
   * Allows content scripts to keep persistent state across tab reloads.
   */ async (msg, sender, sendRes) => {
    if (!msg.type.startsWith("state.")) return;

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
  },
);
