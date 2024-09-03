/// FIXES: Logging in to hunter takes forever, and it also logs you out very
/// often. It also takes a long time to log in.

console.log("Logging in automatically...");

// don't use await, so that it works if started part way through the login process

{
  // hunter login page
  const nextButton = "input[type='submit']#nextBtn";
  const usernameEntered = () => document.getElementById("Username").value != "";
  waitForElem(nextButton)
    .then(clickWhen(usernameEntered))
    .catch((_) => console.error("Failed to find hunter login button"));
}

{
  // google login page
  // find first hunter email
  const hunterEmail = "[data-identifier$='@hunterschools.org']";
  waitForElem(hunterEmail)
    .then(clickElem)
    .catch((_) => console.error("Failed to find google email."));

  // wait for password
  // this works best w/ password autofill
  const passwordNextBtn = () =>
    Array.from(document.querySelectorAll("button span")).filter((e) => {
      return e.textContent === "Next";
    })[0];
  waitFor(passwordNextBtn)
    .then(clickElem)
    .catch((_) => console.error("Could not find password next button."));
}
