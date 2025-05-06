/**
 * Display an error to the user.
 * @param {ApiError} err
 */
const reportError = (err) => {
  console.error(err);
  if (shouldAlert(err)) {
    // TODO: include count of how many times it occurred
    const banner = BannerAlert.createBanner(
      `Error: ${err.message}. If this persists, please contact Gavin.`,
      "warning",
      [
        { name: "full-error", displayText: "Show full error" },
        { name: "email", displayText: "Email Gavin" },
      ],
    );
    const fullMessage = `${err}\n\nCause:\n${err.cause}\n\nStack:\n${err.stack}`;
    banner.addEventListener("banner-alert-action-full-error", () => {
      alert(fullMessage);
    });
    banner.addEventListener("banner-alert-action-email", () => {
      const a = document.createElement("a");
      a.href = `mailto:gavinmorrow${"@"}hunterschools${"."}org?subject=${encodeURI("Error in Hunter Extension")}&body=${encodeURI(fullMessage)}`;
      a.target = "_blank";
      a.click();
    });
  }
};

///-/// Prevent spam errors from being reported too much ///-///
/** @type {Map<keyof typeof ApiError.MESSAGES, number> } */
let recentErrors = new Map();
/** @param {ApiError} err @returns {bool}*/
const shouldAlert = (err) => {
  const numRecent = recentErrors.get(err.action) ?? 0;

  // Increment count
  recentErrors.set(err.action, numRecent + 1);
  // Decrement count after period of time
  setTimeout(
    () => recentErrors.set(err.action, recentErrors.get(err.action) - 1),
    1 * 1000,
  );

  return numRecent <= 0;
};
