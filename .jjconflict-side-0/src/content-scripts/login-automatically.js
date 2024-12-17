/// FIXES: Logging in to hunter takes forever, and it also logs you out very
/// often. It also takes a long time to log in.

console.log("Logging in automatically...");

const alreadyLoggedIn = async () => waitForElem("#site-logo");

const hunterLogin = featureFlag(
  (s) => s.loginAutomatically.hunter,
  async () => {
    console.log("Trying to login w/ Hunter...");

    const nextBtnSelector = "input[type='submit']#nextBtn";
    const usernameEntered = () =>
      document.getElementById("Username")?.value != "";

    const nextBtn = await waitForElem(nextBtnSelector);
    if (nextBtn == null) return;

    await waitFor(usernameEntered);
    await browser.runtime.sendMessage({
      type: "state.set",
      data: { isLoggingIn: true },
    });
    nextBtn.click();
  },
);

const blackbaudLogin = featureFlag(
  (s) => s.loginAutomatically.blackbaud,
  async () => {
    console.log("Trying to login w/ Blackbaud...");

    const btn = await waitForElem("#primary-button");
    btn?.click();
  },
);

/**
 * Wrap a function, to make it run only when the user is logging in.
 * @param {() => Promise<any>} fn The function to run.
 * @returns {() => Promise<any>} A function that will check if the user is currently logging in before calling the provided function.
 */
const requireLoggingIn = (fn) => async () => {
  console.log("Checking if logged in......");

  const state = await tabState();
  const isLoggingIn = state.isLoggingIn ?? false;
  const alreadyLoggedIn = state.alreadyLoggedIn ?? false;

  if (!isLoggingIn || alreadyLoggedIn) {
    console.log("Not currently logging in, skipping autologin.");
    return;
  }
  return fn();
};

const googleEmail = featureFlag(
  (s) => s.loginAutomatically.google.email,
  requireLoggingIn(async () => {
    console.log("Trying to find Google email...");

    // google login page
    // find first hunter email
    const hunterEmail = "[data-identifier$='@hunterschools.org']";

    const emailBtn = await waitForElem(hunterEmail);
    console.log("Found emailBtn!", emailBtn);
    // repeat until the page unloads (sometimes google's js doesn't load fast enough)
    setInterval(() => emailBtn?.click(), 500);
  }),
);

const googlePassword = featureFlag(
  (s) => s.loginAutomatically.google.password,
  requireLoggingIn(async () => {
    console.log("Trying to enter Google password...");

    // google password page
    // this works best w/ password autofill
    const passwordNextBtn = () =>
      Array.from(document.querySelectorAll("button span")).filter((e) => {
        return e.textContent === "Next";
      })[0];

    const nextBtn = await waitFor(passwordNextBtn);
    if (nextBtn == null) return;
    nextBtn.click();
  }),
);

promiseError(async () => {
  const loginPromise = Promise.any([
    hunterLogin(),
    blackbaudLogin(),
    googleEmail(),
    googlePassword(),
  ]);
  await Promise.any([alreadyLoggedIn(), loginPromise]);

  console.log("Finished logging in.");
})();
