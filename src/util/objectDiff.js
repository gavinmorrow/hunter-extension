/**
 * Find the difference in two objects.
 * @template {Object} T
 * @param {T} a
 * @param {T} b
 */
const findDiff = (a, b) => {
  const diff = {};
  for (const key of Object.keys(a)) {
    if (a[key] !== b[key]) {
      if (typeof a[key] === "object" && typeof b[key] === "object") {
        const nestedDiff = findDiff(a[key], b[key]);
        if (Object.keys(nestedDiff).length > 0) {
          diff[key] = nestedDiff;
        }
      } else diff[key] = b[key];
    }
  }
  return diff;
};

/**
 * @param {Object} o
 * @param {Object} diff
 */
const applyDiff = (o, diff) => {
  const clone = structuredClone(o);
  if (diff == null) return clone;

  for (const key of Object.keys(diff)) {
    if (typeof diff[key] === "object") {
      clone[key] = applyDiff(clone[key], diff[key]);
    } else clone[key] = diff[key];
  }
  return clone;
};
