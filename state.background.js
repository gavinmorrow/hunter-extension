/**
 * @typedef {number} TabId
 * @typedef {{[any]: any}} State
 */

/** @type {{[TabId]: State}} */
const state = {};

browser.runtime.onMessage.addListener(
  /**
   * Allows content scripts to keep persistent state across tab reloads.
   */ (msg, sender, sendRes) => {
    if (!msg.type.startsWith("state.")) return;

    const tabId = sender.tab.id;
    const tabState = state[tabId];

    switch (msg.type) {
      case "state.get":
        sendRes(tabState);
        break;
      case "state.set":
        tabState = { ...tabState, ...msg.data };
        sendRes(tabState);
        break;
      case "state.delete":
        state[tabId] = undefined;
        break;
      default:
        console.error(`Unknown message type ${msg.type}`);
    }
  },
);
