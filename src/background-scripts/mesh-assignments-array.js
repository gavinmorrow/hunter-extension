import meshObjects from "../util/meshObjects.js";

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

export default function meshAssignmentsArray(/** @type {Object[]} */ a, /** @type {Object[]} */ b) {
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
