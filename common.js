const DEFAULT_TIMEOUT = 10000;

/**
 * Waits for a function to return a truthy value.
 * @template T The type of the value to wait for.
 * @param {() => T} fn A function that returns the value to wait for. If the value is truthy, the promise resolves.
 * @param {number|undefined} timeout The amount to wait before failing (in ms). If undefined, will wait indefinitely. Defaults to DEFAULT_TIMEOUT.
 * @param {number} interval The interval to check for the element (in ms). Defaults to 100.
 * @returns {Promise<T|null>} Resolves with the value returned by the function, or resolves with null if the timeout is reached.
 */
const waitFor = (fn, timeout = DEFAULT_TIMEOUT, interval = 100) =>
  new Promise((resolve, reject) => {
    let timeoutId =
      timeout != undefined ? setTimeout(() => resolve(null), timeout) : null;
    let intervalId = setInterval(() => {
      const result = fn();
      if (result) {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
        resolve(result);
      }
    }, interval);
  });

/**
 * Waits for an element to appear on the page.
 * @param {String} selector The query selector to wait for.
 * @param {number|undefined} timeout The amount to wait before failing (in ms). If undefined, will wait indefinitely. Defaults to DEFAULT_TIMEOUT.
 * @param {number} interval The interval to check for the element (in ms). Defaults to 100.
 * @returns {Promise<HTMLElement|null>} A promise that resolves to the element if it is found, or resolves with null if the timeout is reached.
 */
const waitForElem = (selector, timeout = DEFAULT_TIMEOUT, interval = 100) =>
  waitFor(() => document.querySelector(selector), timeout, interval);

/**
 * Waits for several elements to appear on the page.
 * @param {String} selector The query selector to wait for.
 * @param {number|undefined} timeout The amount to wait before failing (in ms). If undefined, will wait indefinitely. Defaults to DEFAULT_TIMEOUT.
 * @param {number} interval The interval to check for the element (in ms). Defaults to 100.
 * @returns {Promise<HTMLElement|null>} A promise that resolves to the element if it is found, or resolves with null if the timeout is reached.
 */
const waitForElems = async (
  selector,
  timeout = DEFAULT_TIMEOUT,
  interval = 100,
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
      return await browser.runtime.sendMessage({
        type: "state.get",
      });
    case null:
      return await browser.runtime.sendMessage({
        type: "state.delete",
      });
    default:
      return await browser.runtime.sendMessage({
        type: "state.set",
        data,
      });
  }
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

const dbg = (a) => {
  console.log(a);
  return a;
};

console.log("Ready!");
