const DEFAULT_TIMEOUT = 10000;
const DEFAULT_INTERVAL = 16;

const dbg = (a) => {
  console.log(a);
  return a;
};

/**
 * Waits for a function to return a truthy value.
 * @template T The type of the value to wait for.
 * @param {() => T} fn A function that returns the value to wait for. If the value is truthy, the promise resolves.
 * @param {number|undefined} timeout The amount to wait before failing (in ms). If undefined, will wait indefinitely. Defaults to DEFAULT_TIMEOUT.
 * @param {number} interval The interval to check for the element (in ms). Defaults to DEFAULT_INTERVAL.
 * @returns {Promise<T|null>} Resolves with the value returned by the function, or resolves with null if the timeout is reached.
 */
const waitFor = (fn, timeout = DEFAULT_TIMEOUT, interval = DEFAULT_INTERVAL) =>
  new Promise((resolve, reject) => {
    // set timeout and interval
    let timeoutId =
      timeout != undefined ? setTimeout(() => resolve(null), timeout) : null;
    let intervalId = setInterval(run, interval);

    // run immediately to minimize delay if it's already ready
    run();

    // use `function` keyword for hoisting
    function run() {
      const result = fn();
      if (result) {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
        resolve(result);
      }
    }
  });

/**
 * Waits for an element to appear on the page.
 * @param {String} selector The query selector to wait for.
 * @param {number|undefined} timeout The amount to wait before failing (in ms). If undefined, will wait indefinitely. Defaults to DEFAULT_TIMEOUT.
 * @param {number} interval The interval to check for the element (in ms). Defaults to DEFAULT_INTERVAL.
 * @returns {Promise<HTMLElement|null>} A promise that resolves to the element if it is found, or resolves with null if the timeout is reached.
 */
const waitForElem = (
  selector,
  timeout = DEFAULT_TIMEOUT,
  interval = DEFAULT_INTERVAL,
) => waitFor(() => document.querySelector(selector), timeout, interval);

/**
 * Waits for several elements to appear on the page.
 * @param {String} selector The query selector to wait for.
 * @param {number|undefined} timeout The amount to wait before failing (in ms). If undefined, will wait indefinitely. Defaults to DEFAULT_TIMEOUT.
 * @param {number} interval The interval to check for the element (in ms). Defaults to DEFAULT_INTERVAL.
 * @returns {Promise<NodeListOf<Element>|null>} A promise that resolves to the element if it is found, or resolves with null if the timeout is reached.
 */
const waitForElems = async (
  selector,
  timeout = DEFAULT_TIMEOUT,
  interval = DEFAULT_INTERVAL,
) => {
  await waitFor(
    () => document.querySelectorAll(selector).length > 0,
    timeout,
    interval,
  );
  return document.querySelectorAll(selector);
};

/**
 * Set or get tab state.
 * @param {(any|null)?} data If provided, the value to set. If null, delete the state.
 */
const tabState = async (data) => {
  switch (data) {
    case undefined:
      return browser.runtime.sendMessage({
        type: "state.get",
      });
    case null:
      return browser.runtime.sendMessage({
        type: "state.delete",
      });
    default:
      return browser.runtime.sendMessage({
        type: "state.set",
        data,
      });
  }
};

/**
 * @typedef {Object} Settings
 *
 *
 * @property {Object} loginAutomatically
 * @property {boolean} loginAutomatically.hunter
 * @property {boolean} loginAutomatically.blackbaud
 * @property {Object} loginAutomatically.google
 * @property {boolean} loginAutomatically.google.email
 * @property {boolean} loginAutomatically.google.password
 *
 *
 * @property {Object} assignmentCenter
 * @property {boolean} assignmentCenter.enabled
 * @property {boolean} assignmentCenter.reloadOnBroken
 * @property {boolean} assignmentCenter.hideLowerNavbar
 *
 * @property {Object} assignmentCenter.statusColors
 * @property {String} assignmentCenter.statusColors.todo
 * @property {String} assignmentCenter.statusColors.inProgress
 * @property {String} assignmentCenter.statusColors.completed
 *
 * @property {Object} assignmentCenter.customUi
 * @property {boolean} assignmentCenter.customUi.enabled
 * @property {{ [String]: String }} assignmentCenter.customUi.statusColors
 *
 * @property {Object} assignmentCenter.calendar
 * @property {boolean} assignmentCenter.calendar.fixCalendarHeaderOverflow
 *
 * @property {Object} assignmentCenter.list
 * @property {boolean} assignmentCenter.list.enabled
 *
 * @property {Object} assignmentCenter.filter
 * @property {boolean} assignmentCenter.filter.enabled
 * @property {boolean} assignmentCenter.filter.autoNotCompleted
 */

/**
 * Set or get user settings.
 * @param {(any|null)?} data If provided, the value to set. If null, reset settings.
 * @returns {Promise<Settings>}
 */
const settings = async (data) => {
  switch (data) {
    case undefined:
      return browser.runtime.sendMessage({
        type: "settings.get",
      });
    case null:
      return browser.runtime.sendMessage({
        type: "settings.reset",
      });
    default:
      return browser.runtime.sendMessage({
        type: "settings.set",
        data,
      });
  }
};

/**
 * Run a function only when a predicate is true. Useful for locking functions behind a feature flag.
 * @template T The return value of `fn()`
 * @param {(settings: Settings) => Promise<boolean>|boolean} predicate Whether or not to run `fn()`. Passed in current settings.
 * @param {() => T} fn The function to run.
 * @returns {() => Promise<T?>} The return value of `fn()`, or void if `fn()` doesn't get called.
 */
const featureFlag = (predicate, fn) => async () => {
  if (await predicate(await settings())) return fn();
  else
    console.debug("Predicate falsy, not calling fn().", predicate.toString());
};

/**
 * Wrap a function, to ensure all errors are logged.
 * @param {() => Promise<any>} fn The function to wrap.
 * @returns {() => Promise<Promise<any>} A function that will log any thrown errors in the provided function. This will rethrow errors.
 */
const promiseError = (fn) => async () => {
  try {
    return await fn();
  } catch (err) {
    console.error(`Error in promise: ${err}\nstack: ${err.stack}`);
    alert(`Error in promise: ${err}\nstack: ${err.stack}`);
    throw err;
  }
};

/**
 * @typedef {Object} BlackbaudAssignment
 * @property {String} LongDescription
 *
 * // lots of other things too but i'm too lazy to list them, add more as needed
 */

/**
 * Fetch an assignment from the Blackbaud API.
 * @param {string} assignmentIndexId Can be found in the link of an assignment.
 * @param {string} studentUserId Can be found in the user's "Profile" link.
 * @returns {Promise<BlackbaudAssignment>} Direct response from a Blackbaud API.
 */
const fetchAssignment = async (assignmentIndexId, studentUserId) =>
  fetch(
    `https://hunterschools.myschoolapp.com/api/assignment2/UserAssignmentDetailsGetAllStudentData?assignmentIndexId=${assignmentIndexId}&studentUserId=${studentUserId}&personaId=2`,
  ).then((r) => r.json());

const updateAssignmentStatus = async (assignmentIndexId, status) => {
  const statusNumMap = {
    Missing: -1,
    Overdue: -1,
    "To do": -1,
    "In progress": 0, // just mark it same as todo
    Completed: 1,
    Graded: 1,
  };
  const assignmentStatus = statusNumMap[status];
  console.log("Setting status to", assignmentStatus, "for", assignmentIndexId);

  return fetch(
    `https://hunterschools.myschoolapp.com/api/assignment2/assignmentstatusupdate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assignmentIndexId,
        assignmentStatus,
      }),
    },
  );
};

console.log("Ready!");
