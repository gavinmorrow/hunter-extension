/**
 * Returns the #orion-main element, or creates it if it doesn't exist.
 * @returns {Promise<HTMLElement>}
 */
const createOrionMain = async (parent) => {
  let orionMain = document.getElementById("orion-main");

  if (orionMain == null) {
    orionMain = document.createElement("div");
    orionMain.id = "orion-main";
    orionMain.style.colorScheme = "dark";

    const s = await settings();
    orionMain.style.filter = `saturate(${s.assignmentCenter.customUi.saturation})`;

    if (parent == null) {
      console.log("Waiting for assignment center...");
      parent = await waitForElem("app-student-assignment-center", null);
    }
    parent.parentElement.prepend(orionMain);
  }

  return orionMain;
};
