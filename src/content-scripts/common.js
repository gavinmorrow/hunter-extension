const VERSION = "0.6.1";

// Check for old version already installed.
let meta = document.getElementById("orion-version");
if (meta != null) {
  // It shouldn't matter what version is already running, because this file
  // should only be run once anyways.
  location.reload();
  throw new Error(
    `Orion version ${meta.getAttribute("x-orion-version")} already running.`,
  );
} else {
  meta = document.createElement("meta");
  meta.id = "orion-version";
  meta.setAttribute("x-orion-version", VERSION);
  document.head.appendChild(meta);
}

const DEFAULT_TIMEOUT = 10000;
const DEFAULT_INTERVAL = 16;

/**
 * @template T
 * @param {T} a
 * @returns {T}
 */
const dbg = (a) => {
  console.log(a);
  return a;
};

/**
 * [Memoize](https://en.wikipedia.org/wiki/Memoization) a function.
 * @template T
 * @param {() => Promise<T>|() => T} fn
 * @returns {[() => Promise<T>, (c: T) => void]}
 */
const memo = (fn) => {
  let cache = null;
  const updateCache = (c) => (cache = c);
  return [
    async () => {
      // `await` only when *reading* the cache otherwise there could be a race
      // condition where the cache is being set by several in-progress promises
      if (cache === null) cache = fn();
      return await cache;
    },
    updateCache,
  ];
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
 * @property {number} assignmentCenter.customUi.saturation
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
 *
 *
 * @property {Object} keepWorking
 * @property {boolean} keepWorking.clickAutomatically
 * @property {boolean} keepWorking.showBanner
 */

/** Get user settings. */
const [settings, updateSettingsCache] = memo(
  /** @returns {Promise<Settings>} */
  async () =>
    browser.runtime.sendMessage({
      type: "settings.get",
    }),
);

/** Do a partial update of settings (only send what needs to be changed). */
const updateSettings = async (partial) =>
  browser.runtime.sendMessage({ type: "settings.update", data: partial });

// FIXME: actually make the cache work.
// This is a temporary workaround to get the better performance of the API
// fetch version without blocking on the cache.
const getAssignmentsCache = async () => [];
// const getAssignmentsCache = async () => (await browser.runtime.sendMessage({
//   type: "assignmentsCache.get",
// })) ?? [];
const setAssignmentsCache = async (newAssignments) =>
  browser.runtime.sendMessage({
    type: "assignmentsCache.set",
    data: newAssignments,
  });
const clearAssignmentsCache = async () =>
  browser.runtime.sendMessage({
    type: "assignmentsCache.clear",
  });

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
 * @param {(err: Error) => void} handler The function to call when the error is caught.
 * @returns {() => Promise<Promise<any>} A function that will log any thrown errors in the provided function. This will rethrow errors.
 */
const promiseError =
  (fn, handler = reportError ?? alert) =>
  async () => {
    // Don't use Promise methods to avoid `InternalError: Promise rejection
    // value is a non-unwrappable cross-compartment wrapper.`
    // (see <https://bugzilla.mozilla.org/show_bug.cgi?id=1871516>)
    try {
      return await fn();
    } catch (err) {
      console.error(`Error in promise: ${err}\nstack: ${err.stack}`);
      handler(err);
      throw err;
    }
  };

/**
 * Make the given element have the given class if *and only if* `predicate` is truthy.
 * @param {HTMLElement} elem
 * @param {String} className
 * @param {boolean} predicate
 */
// Not really a predicate, but imo it's close enough.
const conditionalClass = (elem, className, predicate) => {
  if (predicate) elem.classList.add(className);
  else elem.classList.remove(className);
};

const buttonStylesInner = `
    --color-text: #eee;
    --color-border: #333;
    --color-bg-root: #111;
    --color-bg-btn: oklch(from var(--color-bg-root) calc(l*120%) c h);

    background-color: var(--color-bg-btn);
    border: 1px solid var(--color-border);
    color: var(--color-text);

    font-size: small; /* normal button size */
    text-decoration: none; /* remove underline on links */

    padding: 0.25em;

    &:hover, &:focus-visible {
      background-color: oklch(from var(--color-bg-btn) calc(l*200%) c h);
    }`;

console.log("Ready!");
