/// FIXES: Logging in to hunter takes forever, and it also logs you out very
/// often. It also takes a long time to log in.

console.log("Logging in automatically...");

const hunterLogin = async () => {
  const nextBtnSelector = "input[type='submit']#nextBtn";
  const usernameEntered = () =>
    document.getElementById("Username")?.value != "";

  const nextBtn = await waitForElem(nextBtnSelector);
  await waitFor(usernameEntered);
  nextBtn?.click();
};

const googleEmail = async () => {
  // google login page
  // find first hunter email
  const hunterEmail = "[data-identifier$='@hunterschools.org']";

  const emailBtn = await waitForElem(hunterEmail);
  emailBtn?.click();
};

const googlePassword = async () => {
  // google password page
  // this works best w/ password autofill
  const passwordNextBtn = () =>
    Array.from(document.querySelectorAll("button span")).filter((e) => {
      return e.textContent === "Next";
    })[0];

  const nextBtn = await waitFor(passwordNextBtn);
  nextBtn?.click();
};

Promise.allSettled([hunterLogin(), googleEmail(), googlePassword()]);
