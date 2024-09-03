/// FIXES: Logging in to hunter takes forever, and it also logs you out very
/// often. It also takes a long time to log in.

console.log("Logging in automatically...");

const DEFAULT_TIMEOUT = 10000; // 10 seconds

// don't use await, so that it works if started part way through the login process

// hunter login page
waitForElem("input[type='submit']#nextBtn", DEFAULT_TIMEOUT)
  .then((btn) =>
    waitFor(() => document.getElementById("Username").value != "").then((_) =>
      btn.click(),
    ),
  )
  .catch((_) => console.error("Failed to find hunter login button"));

// google login page
// find first hunter email
waitForElem("[data-identifier$='@hunterschools.org']", DEFAULT_TIMEOUT)
  .then(clickElem)
  .catch((_) => console.error("Failed to find google email."));
// wait for password
// this works best w/ password autofill
waitFor(
  () =>
    Array.from(document.querySelectorAll("button span")).filter((e) => {
      return e.textContent === "Next";
    })[0],
)
  .then(clickElem)
  .catch((_) => console.error("Could not find password next button."));
