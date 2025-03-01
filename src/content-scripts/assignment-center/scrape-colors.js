/**
 * Assumes the page is already loaded.
 * @returns A map of class names (*not* ids) to *rgb* css colors.
 */
const [scrapeClassColors, _updateScrapedClassColors] = memo(async () => {
  const toolbarDropdownButtons = Array.from(
    document.querySelectorAll(
      // Select for all dropdown buttons in the toolbar
      "app-student-assignment-center sky-toolbar button.sky-dropdown-button"
    )
  ).filter(
    // There are multiple that are dropdowns (although one is hidden):
    // "Reports" and "More" (the "…"). They have weird spaces in front/behind,
    // so just check if it is included.
    btn => btn.textContent.toLowerCase().includes("more")
  );

  if (toolbarDropdownButtons.length != 1) {
    console.warn("Could not find the view more toolbar button. Candidates: ", toolbarDropdownButtons);
    return new Map();
  }

  toolbarDropdownButtons[0].click();

  // Hide the popup
  document.querySelector("sky-dropdown-menu").style.display = "none";
  // Wait for a bit because it doesn't appear instantly. (CURSE YOU ANGULAR(?))
  await new Promise(r => setTimeout(r, 100));
  // Show the popup again because the rest of the stuff happens quickly enough
  // to not actually show up, and this is very close to the code that hides it.
  // Also, if the user disables the custom UI, they might want to use this.
  document.querySelector("sky-dropdown-menu").style.display = "";

  const editViewSettingsBtn = Array.from(
    document.querySelectorAll("sky-dropdown-menu sky-dropdown-item button")
  ).filter(btn => btn.textContent.toLowerCase().includes("view settings"));

  if (editViewSettingsBtn.length != 1) {
    console.warn("Could not find the edit view settings button. Candidates: ", editViewSettingsBtn);
    return new Map();
  }

  editViewSettingsBtn[0].click();

  const colorpickers = Array.from(
    document.querySelectorAll("sky-modal-content sky-colorpicker")
  );
  const colors = colorpickers.map(colorpicker =>
    colorpicker.querySelector("button[title*='select' i]").style.backgroundColor
  );
  const classes = colorpickers.map(btn => btn.parentElement.previousElementSibling.textContent.trim());
  const map = new Map();
  for (let i = 0; i < classes.length; i++) {
    map.set(classes[i], colors[i]);
  }

  const closeBtn = Array.from(
    document.querySelectorAll("sky-modal-footer button")
  ).find(btn => btn.textContent.toLowerCase().includes("cancel"));

  if (closeBtn != undefined) closeBtn.click();
  else {
    // TODO: report error unobtrusively.
    console.error("Could not find the close button.");

    // As a backup, just hide the entire modal so stuff is still useable.
    document.querySelector("sky-modal-host").style.display = "none";
  }

  return map;
});
