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

console.log("Ready!");
