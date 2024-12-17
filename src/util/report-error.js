/**
 * Display an error to the user.
 * @param {ApiError} err
 */
const reportError = err => {
  console.error(err);
  alert(`Error: ${err.message}. If this persists, please contact Gavin.`);
};
