/**
 * Sort two of anything for `Array.prototype.sort()`
 * @returns {-1|0|+1} -1 if a < b, +1 if a > b, and 0 otherwise
 */
const sortForArray = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
