const isObject = (o) => o?.toString() === "[object Object]";

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
      if (isObject(a[key]) && isObject(b[key])) {
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
    if (isObject(diff[key])) {
      clone[key] = applyDiff(clone[key], diff[key]);
    } else clone[key] = diff[key];
  }
  return clone;
};
