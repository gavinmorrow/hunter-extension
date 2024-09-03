const waitForElem = (selector, interval = 100, timeout = undefined) =>
  new Promise((resolve, reject) => {
    let timeoutId =
      timeout != undefined ? setTimeout(() => reject(null), timeout) : null;
    let intervalId = setInterval(() => {
      if (document.querySelector(selector)) {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
        resolve(document.querySelector(selector));
      }
    }, interval);
  });
