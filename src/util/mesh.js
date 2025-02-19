/// a clone of /src/util/meshObjects.js and src/util/mesh-ssignments-array.js
/// FIXME: When moving content scripts to ES modules delete this file

/** @param {Object} a @param {Object} b */
const meshObjects = (a = {}, b = {}) => {
  const o = structuredClone(a);
  for (const p in b) {
    if (Object.hasOwn(o, p) && typeof o[p] === "object")
      o[p] = meshObjects(o[p], b[p]);
    else o[p] = b[p];
  }
  return o;
};

/**
 * @template T
 * @param {T[]} as
 * @returns {Map<number, T>}
 */
const mapAssignments = as => as.reduce(
  (/** @type {Map<number, Object>} */ map, a) =>
    // FIXME: would task ids conflict w/ assignment ids?
    map.set(a.id, a),
  new Map(),
);

const meshAssignmentsArray = (/** @type {Object[]} */ a, /** @type {Object[]} */ b) => {
  // Turn each array into a map by assignment id.
  const aMap = mapAssignments(a);
  const bMap = mapAssignments(b);

  const final = [];

  // Mesh each assignment
  for (const assignment of aMap.values()) {
    const newAssignment = bMap.get(assignment.id);
    if (newAssignment == null) {
      final.push(assignment);
    } else {
      const meshed = meshObjects(assignment, newAssignment);
      final.push(meshed);
    }
  }
  // Remember all the ones that are in B but not A
  for (const assignment of bMap.values()) {
    const oldAssignment = aMap.get(assignment.id);
    if (oldAssignment == null) {
      final.push(assignment);
    } else {
      // Already handled in the A for loop
    }
  }

  return final;
};
