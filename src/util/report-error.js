/**
 * Display an error to the user.
 * @param {ApiError} err
 */
const reportError = err => {
  console.error(err);
  if (shouldAlert(err)) {
    alert(`Error: ${err.message}. If this persists, please contact Gavin.`);
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
  setTimeout(() => recentErrors.set(err.action, recentErrors.get(err.action) - 1), 1 * 1000);

  return numRecent <= 0;
};
