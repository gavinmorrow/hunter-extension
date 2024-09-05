/// FIXES: Logging in to hunter takes forever, and it also logs you out very
/// often. It also takes a long time to log in.

console.log("Logging in automatically...");

const hunterLogin = async () => {
  const nextBtnSelector = "input[type='submit']#nextBtn";
  const usernameEntered = () =>
    document.getElementById("Username")?.value != "";

  const nextBtn = await waitForElem(nextBtnSelector);
  if (nextBtn == null) return;

  await waitFor(usernameEntered);
  nextBtn.click();
  await browser.runtime.sendMessage({
    type: "state.set",
    data: { isLoggingIn: true },
  });
};

/**
 * Wrap a function, to make it run only when the user is logging in.
 * @param {() => Promise<any>} fn The function to run.
 * @returns {() => Promise<any>} A function that will check if the user is currently logging in before calling the provided function.
 */
const requireLoggingIn = (fn) => async () => {
  const { isLoggingIn } = await browser.runtime.sendMessage({
    type: "state.get",
  });
  if (!isLoggingIn) {
    console.log("Not currently logging in, skipping autologin.");
    return;
  }
  return fn();
};

const googleEmail = requireLoggingIn(async () => {
  // google login page
  // find first hunter email
  const hunterEmail = "[data-identifier$='@hunterschools.org']";

  const emailBtn = await waitForElem(hunterEmail);
  emailBtn?.click();
});

const googlePassword = requireLoggingIn(async () => {
  // google password page
  // this works best w/ password autofill
  const passwordNextBtn = () =>
    Array.from(document.querySelectorAll("button span")).filter((e) => {
      return e.textContent === "Next";
    })[0];

  const nextBtn = await waitFor(passwordNextBtn);
  if (nextBtn == null) return;
  nextBtn.click();
});

Promise.allSettled([hunterLogin(), googleEmail(), googlePassword()]);
